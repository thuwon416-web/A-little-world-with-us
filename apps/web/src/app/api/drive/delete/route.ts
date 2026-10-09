import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile, getDriveFileAccess } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const authorization = request.headers.get('authorization')
  const supabase = authorization
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } })
    : await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { fileId?: string } | null
  const fileId = body?.fileId
  if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) return NextResponse.json({ error: 'Invalid fileId.' }, { status: 400 })
  const rateLimit = await checkRateLimit(`drive-delete:${user.id}`, 10, 60_000)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many Drive delete requests. Please try again shortly.', resetAt: rateLimit.resetTime }, { status: 429 })
  try {
    const access = await getDriveFileAccess(user.id, fileId)
    if (!access) return NextResponse.json({ error: 'File not found.' }, { status: 404 })
    if (!access.canDelete) return NextResponse.json({ error: 'Only the original media owner can permanently delete this Drive file.' }, { status: 403 })
    const driveActor = access.recordType === 'archived_media' ? access.accessUserId : access.ownerId
    if (!driveActor) return NextResponse.json({ error: 'No connected Drive account can access this file.' }, { status: 409 })
    await deleteDriveFile(driveActor, fileId)
    if (access.recordType === 'memory') {
      const { error } = await supabase.from('memories').update({
        drive_file_id: null,
        drive_folder_id: null,
        storage_provider: 'supabase',
        storage_path: null,
        image_url: null,
      }).eq('id', access.recordId)
      if (error) throw error
    } else if (access.recordType === 'message') {
      const { error } = await supabase.from('messages').update({
        media_url: null,
        media_storage_provider: null,
        media_storage_path: null,
        media_storage_file_id: null,
        media_size_bytes: null,
      }).eq('id', access.recordId)
      if (error) throw error
    } else if (access.recordType === 'chat_archive') {
      const { error } = await supabase.from('chat_archive_days').update({
        drive_file_id: null,
      }).eq('id', access.recordId)
      if (error) throw error
    } else if (access.recordType === 'archived_media') {
      const { error } = await supabase.from('drive_media_archive').delete().eq('id', access.recordId)
      if (error) throw error
    }
    return NextResponse.json({ deleted: true, recordType: access.recordType })
  } catch (error) {
    console.error('[drive] file delete failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Google Drive file deletion failed.' }, { status: 502 })
  }
}
