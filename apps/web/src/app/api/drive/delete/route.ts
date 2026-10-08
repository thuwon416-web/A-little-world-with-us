import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile, getDriveFileAccess } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
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
    if (!access.canDelete) return NextResponse.json({ error: 'Only the memory owner can delete this file.' }, { status: 403 })
    await deleteDriveFile(access.ownerId, fileId)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('[drive] file delete failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Google Drive file deletion failed.' }, { status: 502 })
  }
}
