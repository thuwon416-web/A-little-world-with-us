import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateMemoryMetadata, validateUploadContent } from '@/lib/upload-validation'
import { logEvent } from '@/lib/observability'
import { deleteCloudinaryAsset, isCloudinaryConfigured, uploadMemoryToCloudinary } from '@/lib/cloudinary'

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

  const rateLimit = await checkRateLimit(user.id, 5, 60_000)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Please try again shortly.' }, { status: 429 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'A file is required.' }, { status: 400 })

  const coupleId = typeof form.get('coupleId') === 'string' ? String(form.get('coupleId')) : ''
  if (!coupleId) return NextResponse.json({ error: 'coupleId is required.' }, { status: 400 })

  const { data: coupleLink, error: coupleLinkError } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()

  if (coupleLinkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!coupleLink) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  const validation = await validateUploadContent(file, { imagesOnly: true })
  if (!validation.valid) return NextResponse.json({ error: validation.error ?? 'Invalid upload.' }, { status: 400 })

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
  if (locationLabel.length > 120) return NextResponse.json({ error: 'Memory location label must be 120 characters or fewer.' }, { status: 400 })

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Primary media storage is not configured.' }, { status: 503 })
  }

  let uploaded: Awaited<ReturnType<typeof uploadMemoryToCloudinary>> | null = null
  try {
    uploaded = await uploadMemoryToCloudinary(file, coupleId)

    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        couple_id: coupleId,
        image_url: null,
        storage_path: null,
        storage_provider: 'cloudinary',
        drive_file_id: null,
        cloudinary_asset_id: uploaded.asset_id,
        cloudinary_public_id: uploaded.public_id,
        storage_url: null,
        thumbnail_url: null,
        size_bytes: uploaded.bytes,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        duration_seconds: uploaded.duration ?? null,
        mime_type: file.type || 'image/*',
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
      // Do not expose provider internals. The orphaned asset can be reconciled by the
      // storage cleanup job using the returned asset metadata.
      console.error('Cloudinary memory metadata insert failed')
      if (uploaded) await deleteCloudinaryAsset(uploaded.asset_id).catch(() => undefined)
      void logEvent('media_upload_failed', { provider: 'cloudinary', status: 500 })
      return NextResponse.json({ error: 'Memory metadata could not be saved.' }, { status: 500 })
    }

    return NextResponse.json({
      file: {
        id: uploaded.asset_id,
        mimeType: file.type || 'image/*',
        secureUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
      },
      memory,
    })
  } catch (error) {
    console.error('Cloudinary memory upload failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Memory upload failed.' }, { status: 502 })
  }
}
