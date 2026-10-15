import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { getOrCreateDriveCoupleFolder, getOrCreateDriveFolder, moveDriveFileToFolder } from '@/lib/google-drive'
import { isSameOriginRequest } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/rate-limit'

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
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit(`memory-delete:${user.id}`, 10, 60_000)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many memory deletion requests. Please try again shortly.', resetAt: rateLimit.resetTime }, { status: 429 })

  const body = (await request.json().catch(() => ({}))) as { memoryId?: string }
  if (!body.memoryId) return NextResponse.json({ error: 'memoryId is required.' }, { status: 400 })

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .select('id,user_id,couple_id,storage_provider,storage_path,image_url,drive_file_id,drive_folder_id,cloudinary_asset_id')
    .eq('id', body.memoryId)
    .maybeSingle()

  if (memoryError) return NextResponse.json({ error: 'Unable to load memory.' }, { status: 500 })
  if (!memory) return NextResponse.json({ error: 'Memory not found.' }, { status: 404 })
  if (memory.user_id !== user.id) return NextResponse.json({ error: 'You can only delete memories you created.' }, { status: 403 })

  // Do not permanently delete original media until a reversible archive workflow is
  // available for that provider. This protects users from losing irreplaceable photos.
  if (memory.storage_provider === 'cloudinary' || memory.storage_provider === 'supabase') {
    return NextResponse.json({
      error: 'This photo is protected from permanent deletion. Reversible archive support is required before it can be removed.',
      code: 'ARCHIVE_REQUIRED',
    }, { status: 409 })
  }

  if (memory.storage_provider !== 'google_drive' || !memory.drive_file_id) {
    return NextResponse.json({
      error: 'This memory has no supported archive target, so it was left unchanged.',
      code: 'ARCHIVE_UNAVAILABLE',
    }, { status: 409 })
  }

  try {
    const coupleFolder = await getOrCreateDriveCoupleFolder(user.id, memory.couple_id)
    const archiveFolder = await getOrCreateDriveFolder(user.id, 'Archive', coupleFolder.id)
    const deletedMemoriesFolder = await getOrCreateDriveFolder(user.id, 'Deleted Memories', archiveFolder.id)

    // Record the recovery metadata before moving the original file. If the archive
    // insert fails, the original remains in its existing Drive location.
    const { error: archiveError } = await supabase.from('drive_media_archive').insert({
      drive_file_id: memory.drive_file_id,
      owner_id: user.id,
      couple_id: memory.couple_id,
      source_type: 'memory',
      source_id: memory.id,
      original_folder_id: memory.drive_folder_id ?? null,
      archive_folder_id: deletedMemoriesFolder.id,
    })
    if (archiveError) throw archiveError

    await moveDriveFileToFolder(user.id, memory.drive_file_id, deletedMemoriesFolder.id)

    const { error: deleteError } = await supabase
      .from('memories')
      .delete()
      .eq('id', memory.id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError
    return NextResponse.json({ ok: true, archived: true })
  } catch (error) {
    console.error('Memory archive failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Memory archive failed. The original file was not intentionally deleted; check its archive state before retrying.' }, { status: 502 })
  }
}
