import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { findDriveChildFile, getOrCreateDriveFolder, getOrCreateDriveRootFolder, listDriveChildren, updateDriveFileContent, uploadDriveFile } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

type ArchiveMessage = {
  id: string
  sender_id: string
  content: string | null
  message_type: string
  media_storage_provider?: string | null
  media_storage_file_id?: string | null
  media_mime_type?: string | null
  created_at: string
  deleted_at?: string | null
}

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

function dateKey(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid archive date.')
  return parsed.toISOString().slice(0, 10)
}

export async function POST(request: Request) {
  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit('drive-chat-archive:' + user.id, 20, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Chat archive is temporarily rate limited.', resetAt: rateLimit.resetTime }, { status: 429 })
  }

  const body = await request.json().catch(() => ({})) as { coupleId?: string; date?: string; messages?: ArchiveMessage[] }
  const coupleId = typeof body.coupleId === 'string' ? body.coupleId.trim() : ''
  const archiveDate = typeof body.date === 'string' ? body.date.trim() : ''
  const messages = Array.isArray(body.messages) ? body.messages : []
  if (!coupleId || !/^\d{4}-\d{2}-\d{2}$/.test(archiveDate)) {
    return NextResponse.json({ error: 'coupleId and a valid archive date are required.' }, { status: 400 })
  }
  if (messages.length > 500) return NextResponse.json({ error: 'Too many chat messages in one archive.' }, { status: 400 })

  const { data: coupleLink, error: coupleLinkError } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'accepted')
    .or('inviter_id.eq.' + user.id + ',accepted_by.eq.' + user.id)
    .maybeSingle()
  if (coupleLinkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!coupleLink) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  try {
    const [year, month] = archiveDate.split('-')
    const root = await getOrCreateDriveRootFolder(user.id)
    const couples = await getOrCreateDriveFolder(user.id, 'Couples', root.id)
    const coupleFolder = await getOrCreateDriveFolder(user.id, coupleId, couples.id)
    const chatFolder = await getOrCreateDriveFolder(user.id, 'Chat', coupleFolder.id)
    const yearFolder = await getOrCreateDriveFolder(user.id, year, chatFolder.id)
    const monthFolder = await getOrCreateDriveFolder(user.id, month, yearFolder.id)
    const filename = archiveDate + '.json'

    const archive = {
      version: 1,
      couple_id: coupleId,
      date: archiveDate,
      messages: messages
        .filter((message) => message && typeof message.id === 'string' && typeof message.created_at === 'string')
        .map((message) => ({
          id: message.id,
          sender_id: message.sender_id,
          content: message.content,
          message_type: message.message_type,
          media: message.media_storage_file_id
            ? {
                provider: message.media_storage_provider ?? 'google_drive',
                file_id: message.media_storage_file_id,
                mime_type: message.media_mime_type ?? null,
              }
            : null,
          created_at: message.created_at,
          deleted_at: message.deleted_at ?? null,
        })),
    }
    const bytes = new TextEncoder().encode(JSON.stringify(archive, null, 2))
    const existing = await findDriveChildFile(user.id, monthFolder.id, filename)
    const driveFile = existing
      ? await updateDriveFileContent(user.id, existing.id, bytes, 'application/json')
      : await uploadDriveFile(
          user.id,
          new File([bytes], filename, { type: 'application/json' }),
          monthFolder.id,
        )

    const { error: upsertError } = await supabase
      .from('chat_archive_days')
      .upsert({
        couple_id: coupleId,
        owner_id: user.id,
        archive_date: archiveDate,
        drive_file_id: driveFile.id,
        drive_folder_id: monthFolder.id,
        message_count: archive.messages.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'couple_id,archive_date' })
    if (upsertError) throw upsertError

    return NextResponse.json({ file: driveFile, messageCount: archive.messages.length })
  } catch (error) {
    console.error('[drive] chat archive failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Google Drive chat archive failed.' }, { status: 502 })
  }
}
