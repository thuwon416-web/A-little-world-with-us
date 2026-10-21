import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile, deleteDriveFolder, getOrCreateDriveCoupleFolder, getOrCreateDriveFolder, uploadDriveFile } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'
import { MAX_MEMORY_IMAGE_SIZE, validateUploadContent } from '@/lib/upload-validation'

export const runtime = 'nodejs'

function getAuthenticatedClient(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!authorization) return createServerClient()
  return Promise.resolve(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  }))
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = await checkRateLimit(`drive-migrate-memory:${user.id}`, 60, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many migration requests. Please try again shortly.' }, { status: 429 })

  const form = await request.formData()
  const memoryId = typeof form.get('memoryId') === 'string' ? String(form.get('memoryId')) : ''
  const file = form.get('file')
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(memoryId) || !(file instanceof File)) {
    return NextResponse.json({ error: 'A valid memoryId and file are required.' }, { status: 400 })
  }
  const validation = await validateUploadContent(file, { imagesOnly: true, maxBytes: MAX_MEMORY_IMAGE_SIZE })
  if (!validation.valid) return NextResponse.json({ error: validation.error ?? 'Invalid image.' }, { status: 400 })

  const { data: memory, error: memoryError } = await supabase.from('memories')
    .select('id,user_id,couple_id,storage_provider,storage_path,drive_file_id,date')
    .eq('id', memoryId).maybeSingle()
  if (memoryError) return NextResponse.json({ error: 'Unable to load memory metadata.' }, { status: 500 })
  if (!memory) return NextResponse.json({ error: 'Memory not found.' }, { status: 404 })
  if (memory.storage_provider === 'google_drive' && memory.drive_file_id) return NextResponse.json({ migrated: false, alreadyInDrive: true })
  if (memory.storage_provider !== 'supabase' || !memory.storage_path || !memory.couple_id) {
    return NextResponse.json({ error: 'This memory is not eligible for safe Drive migration.' }, { status: 409 })
  }
  const { data: link, error: linkError } = await supabase.from('couple_links').select('id')
    .eq('couple_id', memory.couple_id).eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).maybeSingle()
  if (linkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!link) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  let driveFile: Awaited<ReturnType<typeof uploadDriveFile>> | null = null
  let memoryFolderId: string | null = null
  try {
    const coupleFolder = await getOrCreateDriveCoupleFolder(user.id, memory.couple_id)
    const memoriesFolder = await getOrCreateDriveFolder(user.id, 'Memories', coupleFolder.id)
    const date = typeof memory.date === 'string' ? memory.date : new Date().toISOString().slice(0, 10)
    const yearFolder = await getOrCreateDriveFolder(user.id, date.slice(0, 4), memoriesFolder.id)
    memoryFolderId = (await getOrCreateDriveFolder(user.id, memory.id, yearFolder.id)).id
    driveFile = await uploadDriveFile(user.id, file, memoryFolderId)

    const { error: updateError } = await supabase.from('memories').update({
      storage_provider: 'google_drive', drive_file_id: driveFile.id,
      drive_folder_id: memoryFolderId, mime_type: driveFile.mimeType || file.type,
      image_url: null, storage_path: null,
    }).eq('id', memory.id).eq('storage_provider', 'supabase').eq('storage_path', memory.storage_path).select('id').single()
    if (updateError) throw updateError
    return NextResponse.json({ migrated: true, memoryId: memory.id, oldStoragePath: memory.storage_path, driveFileId: driveFile.id })
  } catch (error) {
    if (driveFile) await deleteDriveFile(user.id, driveFile.id).catch(() => undefined)
    if (memoryFolderId) await deleteDriveFolder(user.id, memoryFolderId).catch(() => undefined)
    const rawError = error instanceof Error ? error.message : 'unknown error'
    console.error('[drive] existing memory migration failed:', rawError)
    const userMessage = rawError.includes('Google Drive is not connected') || rawError.includes('reauthorized')
      ? 'Google Drive is not connected. Please connect Google Drive first.'
      : rawError.includes('token') || rawError.includes('OAuth')
      ? 'Google Drive session expired. Please reconnect Google Drive.'
      : `Migration failed: ${rawError}`
    return NextResponse.json({ error: userMessage }, { status: 502 })
  }
}
