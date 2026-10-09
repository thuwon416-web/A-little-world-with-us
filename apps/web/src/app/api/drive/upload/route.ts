import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile, deleteDriveFolder, getOrCreateDriveCoupleFolder, getOrCreateDriveFolder, uploadDriveFile } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'
import { MAX_MEMORY_IMAGE_SIZE } from '@/lib/upload-validation'
import { validateMemoryMetadata, validateUploadContent } from '@/lib/upload-validation'

export const runtime = 'nodejs'

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

  const rateLimit = await checkRateLimit(`drive-upload:${user.id}`, 5, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again shortly.', resetAt: rateLimit.resetTime },
      { status: 429 }
    )
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A file is required.' }, { status: 400 })
  }
  const coupleId = typeof form.get('coupleId') === 'string' ? String(form.get('coupleId')) : ''
  if (!coupleId) {
    return NextResponse.json({ error: 'coupleId is required.' }, { status: 400 })
  }

  const { data: coupleLink, error: coupleLinkError } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()

  if (coupleLinkError) {
    return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  }
  if (!coupleLink) {
    return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })
  }

  const validation = await validateUploadContent(file, { imagesOnly: true, maxBytes: MAX_MEMORY_IMAGE_SIZE })
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error ?? 'Invalid upload.' }, { status: 400 })
  }

  const title = typeof form.get('title') === 'string' ? String(form.get('title')).trim() : 'A memory together'
  const caption = typeof form.get('caption') === 'string' ? String(form.get('caption')).trim() : 'A memory together'
  const category = typeof form.get('category') === 'string' ? String(form.get('category')).trim() : 'favorite'
  const date = typeof form.get('date') === 'string' ? String(form.get('date')).trim() : new Date().toISOString().slice(0, 10)
  const metadataValidation = validateMemoryMetadata({ title, caption, category, date })
  if (!metadataValidation.valid) {
    return NextResponse.json({ error: metadataValidation.error ?? 'Invalid memory metadata.' }, { status: 400 })
  }

  const latitudeValue = typeof form.get('latitude') === 'string' ? Number(form.get('latitude')) : null
  const longitudeValue = typeof form.get('longitude') === 'string' ? Number(form.get('longitude')) : null
  const locationLabel = typeof form.get('locationLabel') === 'string' ? String(form.get('locationLabel')).trim() : ''
  const hasLatitude = latitudeValue !== null && Number.isFinite(latitudeValue)
  const hasLongitude = longitudeValue !== null && Number.isFinite(longitudeValue)
  if (hasLatitude !== hasLongitude || (hasLatitude && (latitudeValue! < -90 || latitudeValue! > 90 || longitudeValue! < -180 || longitudeValue! > 180))) {
    return NextResponse.json({ error: 'Invalid memory location.' }, { status: 400 })
  }
  if (locationLabel.length > 120) {
    return NextResponse.json({ error: 'Memory location label must be 120 characters or fewer.' }, { status: 400 })
  }

  const memoryId = crypto.randomUUID()
  let driveFile: Awaited<ReturnType<typeof uploadDriveFile>> | null = null
  let driveMemoryFolderId: string | null = null
  try {
    const coupleFolder = await getOrCreateDriveCoupleFolder(user.id, coupleId)
    const memoriesFolder = await getOrCreateDriveFolder(user.id, 'Memories', coupleFolder.id)
    const yearFolder = await getOrCreateDriveFolder(user.id, date.slice(0, 4), memoriesFolder.id)
    driveMemoryFolderId = (await getOrCreateDriveFolder(user.id, memoryId, yearFolder.id)).id

    driveFile = await uploadDriveFile(user.id, file, driveMemoryFolderId)

    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        id: memoryId,
        user_id: user.id,
        couple_id: coupleId,
        image_url: null,
        storage_path: null,
        storage_provider: 'google_drive',
        drive_file_id: driveFile.id,
        drive_folder_id: driveMemoryFolderId,
        mime_type: driveFile.mimeType || file.type || 'application/octet-stream',
        title,
        caption,
        date,
        category,
        latitude: hasLatitude ? latitudeValue : null,
        longitude: hasLongitude ? longitudeValue : null,
        location_label: locationLabel || null,
      })
      .select('id,created_at')
      .single()

    if (memoryError) {
      await deleteDriveFile(user.id, driveFile.id).catch(() => undefined)
      await deleteDriveFolder(user.id, driveMemoryFolderId).catch(() => undefined)
      return NextResponse.json({ error: 'Memory metadata could not be saved.' }, { status: 400 })
    }

    return NextResponse.json({ file: driveFile, memory })
  } catch (error) {
    console.error('[drive] memory upload failed:', error instanceof Error ? error.message : 'unknown error')
    if (driveFile) await deleteDriveFile(user.id, driveFile.id).catch(() => undefined)
    if (driveMemoryFolderId) await deleteDriveFolder(user.id, driveMemoryFolderId).catch(() => undefined)
    return NextResponse.json(
      { error: 'Google Drive memory upload failed.' },
      { status: 502 }
    )
  }
}
