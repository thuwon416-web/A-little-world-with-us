import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { uploadDriveFile } from '@/lib/google-drive'
import { createPrivateCloudinaryUrl } from '@/lib/cloudinary-url'
import { getB2DownloadUrl } from '@/lib/backblaze-b2'
import { checkRateLimit } from '@/lib/rate-limit'

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

  const rate = await checkRateLimit(`drive-export:${user.id}`, 10, 60 * 60 * 1000)
  if (!rate.allowed) return NextResponse.json({ error: 'Too many Drive export requests.' }, { status: 429 })

  const body = (await request.json().catch(() => ({}))) as { memoryId?: string; folderId?: string }
  if (!body.memoryId) return NextResponse.json({ error: 'memoryId is required.' }, { status: 400 })

  const { data: memory } = await supabase
    .from('memories')
    .select('id,user_id,couple_id,title,mime_type,storage_provider,storage_path,drive_file_id,cloudinary_public_id,b2_file_name')
    .eq('id', body.memoryId)
    .maybeSingle()
  if (!memory) return NextResponse.json({ error: 'Memory not found.' }, { status: 404 })

  const { data: link } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', memory.couple_id)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()
  if (!link) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  if (memory.storage_provider === 'google_drive' && memory.drive_file_id) {
    return NextResponse.json({ ok: true, driveFileId: memory.drive_file_id, alreadyExported: true })
  }

  try {
    let sourceUrl: string | null = null
    if (memory.storage_provider === 'cloudinary' && memory.cloudinary_public_id) {
      const format = memory.mime_type?.split('/')[1] || 'webp'
      sourceUrl = createPrivateCloudinaryUrl(memory.cloudinary_public_id, format)
    } else if (memory.storage_provider === 'backblaze_b2' && memory.b2_file_name) {
      sourceUrl = await getB2DownloadUrl(memory.b2_file_name, 900)
    } else if (memory.storage_provider === 'supabase' && memory.storage_path) {
      const { data } = await supabase.storage.from('memories').createSignedUrl(memory.storage_path, 900)
      sourceUrl = data?.signedUrl ?? null
    }
    if (!sourceUrl) return NextResponse.json({ error: 'Memory media is not available for export.' }, { status: 409 })

    const source = await fetch(sourceUrl)
    if (!source.ok) return NextResponse.json({ error: 'Unable to read memory media for export.' }, { status: 502 })
    const bytes = await source.arrayBuffer()
    const file = new File([bytes], memory.title || 'memory', { type: memory.mime_type || 'application/octet-stream' })
    const driveFile = await uploadDriveFile(user.id, file, body.folderId)

    return NextResponse.json({ ok: true, driveFileId: driveFile.id, name: driveFile.name })
  } catch {
    return NextResponse.json({ error: 'Unable to export memory to Google Drive.' }, { status: 502 })
  }
}
