import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { getOrCreateDriveRootFolder, listDriveChildren } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'

export const runtime = 'nodejs'

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder'
const IMAGE_MIME_PREFIX = 'image/'
const MAX_FILES = 200
const MAX_DEPTH = 7

function getAuthenticatedClient(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!authorization) return createServerClient()
  return Promise.resolve(
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
  )
}

function safeDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10)
}

function isImportableImage(file: { mimeType: string; name: string }) {
  return file.mimeType.startsWith(IMAGE_MIME_PREFIX) && !file.name.startsWith('.')
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = user.id

  const rateLimit = await checkRateLimit('drive-memory-sync:' + userId, 3, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Drive memory sync is temporarily rate limited.', resetAt: rateLimit.resetTime }, { status: 429 })
  }

  const body = await request.json().catch(() => ({})) as { coupleId?: string }
  const coupleId = typeof body.coupleId === 'string' ? body.coupleId.trim() : ''
  if (!coupleId) return NextResponse.json({ error: 'coupleId is required.' }, { status: 400 })

  const { data: coupleLink, error: coupleLinkError } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'accepted')
    .or('inviter_id.eq.' + userId + ',accepted_by.eq.' + userId)
    .maybeSingle()

  if (coupleLinkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!coupleLink) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  try {
    const root = await getOrCreateDriveRootFolder(userId)
    const visited = new Set<string>()
    const imageFiles: Array<{ id: string; name: string; mimeType: string; modifiedTime?: string; parentId: string; groupName: string }> = []

    async function walk(folderId: string, groupName: string, depth: number) {
      if (depth > MAX_DEPTH || visited.has(folderId) || imageFiles.length >= MAX_FILES) return
      visited.add(folderId)
      const children = await listDriveChildren(userId, folderId)
      for (const file of children.files) {
        if (imageFiles.length >= MAX_FILES) break
        if (file.mimeType === DRIVE_FOLDER_MIME) {
          if (file.name === 'Chat' || file.name === 'System' || file.name === 'Archive') continue
          if (file.name === 'Couples') {
            // The app-managed Couples tree can contain other relationships. Never
            // import another couple's media into the couple ID supplied by the caller.
            const managedCouples = await listDriveChildren(userId, file.id)
            const requestedCouple = managedCouples.files.find((child) =>
              child.mimeType === DRIVE_FOLDER_MIME && child.name === coupleId
            )
            if (requestedCouple) await walk(requestedCouple.id, groupName, depth + 2)
            continue
          }
          const isYearFolder = file.name.length === 4 && [...file.name].every((char) => char >= '0' && char <= '9')
          const nextGroup = file.name === 'Memories' || isYearFolder ? groupName : file.name
          await walk(file.id, nextGroup, depth + 1)
        } else if (isImportableImage(file)) {
          imageFiles.push({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            modifiedTime: file.modifiedTime,
            parentId: folderId,
            groupName: groupName || 'Imported memories',
          })
        }
      }
    }

    await walk(root.id, 'Imported memories', 0)

    let imported = 0
    let updated = 0
    let skippedConflicts = 0
    for (const file of imageFiles) {
      const { data: existing, error: existingError } = await supabase
        .from('memories')
        .select('id,title,date,drive_folder_id,couple_id,location_label')
        .eq('drive_file_id', file.id)
        .maybeSingle()
      if (existingError) throw existingError

      const date = safeDate(file.modifiedTime)
      if (existing?.id && existing.couple_id && existing.couple_id !== coupleId) {
        // A Drive file can only be indexed into the couple that already owns its metadata.
        // Do not rewrite another couple's memory when importing shared/external folders.
        skippedConflicts += 1
        continue
      }
      if (existing?.id) {
        const { error } = await supabase
          .from('memories')
          .update({ title: existing.title || file.groupName, date, drive_folder_id: file.parentId, mime_type: file.mimeType, storage_provider: 'google_drive', location_label: existing.location_label || (file.groupName !== 'Imported memories' ? file.groupName : null) })
          .eq('id', existing.id)
        if (error) throw error
        updated += 1
      } else {
        const { error } = await supabase.from('memories').insert({
          id: crypto.randomUUID(),
          user_id: userId,
          couple_id: coupleId,
          image_url: null,
          storage_path: null,
          storage_provider: 'google_drive',
          drive_file_id: file.id,
          drive_folder_id: file.parentId,
          mime_type: file.mimeType,
          title: file.groupName,
          caption: null,
          date,
          category: 'favorite',
          location_label: file.groupName !== 'Imported memories' ? file.groupName : null,
        })
        if (error) throw error
        imported += 1
      }
    }

    return NextResponse.json({ rootFolderId: root.id, scanned: imageFiles.length, imported, updated, skippedConflicts })
  } catch (error) {
    console.error('[drive] memory sync failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Google Drive memory sync failed.' }, { status: 502 })
  }
}
