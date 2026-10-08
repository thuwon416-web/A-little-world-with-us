import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { getOrCreateDriveFolder, getOrCreateDriveRootFolder, uploadDriveFile } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'
import { MAX_MEMORY_IMAGE_SIZE, validateUploadContent } from '@/lib/upload-validation'

export const runtime = 'nodejs'

const MAX_DRIVE_CHAT_IMAGE_SIZE = 25 * 1024 * 1024

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

export async function POST(request: Request) {
  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit('drive-chat-upload:' + user.id, 10, 60_000)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many chat media uploads. Please try again shortly.', resetAt: rateLimit.resetTime }, { status: 429 })

  const form = await request.formData()
  const file = form.get('file')
  const coupleId = typeof form.get('coupleId') === 'string' ? String(form.get('coupleId')).trim() : ''
  if (!(file instanceof File) || !coupleId) return NextResponse.json({ error: 'A file and coupleId are required.' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Drive chat media currently supports image attachments.' }, { status: 400 })
  if (file.size > MAX_DRIVE_CHAT_IMAGE_SIZE) return NextResponse.json({ error: 'Chat images over 25 MB use the large-media path instead.' }, { status: 413 })

  const { data: coupleLink, error: coupleLinkError } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'accepted')
    .or('inviter_id.eq.' + user.id + ',accepted_by.eq.' + user.id)
    .maybeSingle()
  if (coupleLinkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!coupleLink) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  const validation = await validateUploadContent(file, { imagesOnly: true, maxBytes: Math.min(MAX_MEMORY_IMAGE_SIZE, MAX_DRIVE_CHAT_IMAGE_SIZE) })
  if (!validation.valid) return NextResponse.json({ error: validation.error ?? 'Invalid image upload.' }, { status: 400 })

  try {
    const root = await getOrCreateDriveRootFolder(user.id)
    const couples = await getOrCreateDriveFolder(user.id, 'Couples', root.id)
    const coupleFolder = await getOrCreateDriveFolder(user.id, coupleId, couples.id)
    const chatFolder = await getOrCreateDriveFolder(user.id, 'Chat', coupleFolder.id)
    const now = new Date()
    const yearFolder = await getOrCreateDriveFolder(user.id, String(now.getUTCFullYear()), chatFolder.id)
    const monthFolder = await getOrCreateDriveFolder(user.id, String(now.getUTCMonth() + 1).padStart(2, '0'), yearFolder.id)

    const safeName = file.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 180) || 'chat-image'
    const namedFile = new File([await file.arrayBuffer()], Date.now() + '-' + crypto.randomUUID() + '-' + safeName, { type: file.type })
    const driveFile = await uploadDriveFile(user.id, namedFile, monthFolder.id)

    return NextResponse.json({
      file: {
        id: driveFile.id,
        name: driveFile.name,
        mimeType: driveFile.mimeType ?? file.type,
        webViewLink: driveFile.webViewLink ?? null,
      },
      storageProvider: 'google_drive',
      storageFileId: driveFile.id,
      storagePath: monthFolder.id,
      url: '/api/drive/file?fileId=' + encodeURIComponent(driveFile.id) + '&download=1',
    })
  } catch (error) {
    console.error('[drive] chat image upload failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Google Drive chat image upload failed.' }, { status: 502 })
  }
}
