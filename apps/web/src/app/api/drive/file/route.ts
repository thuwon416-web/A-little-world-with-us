import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { downloadDriveFile, getDriveFileAccess, listDriveFile } from '@/lib/google-drive'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  const supabase = authorization
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: authorization } },
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fileId = new URL(request.url).searchParams.get('fileId')
  if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) return NextResponse.json({ error: 'Invalid fileId.' }, { status: 400 })
  const rateLimit = await checkRateLimit(`drive-file:${user.id}:${fileId}`, 30, 60_000)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many Drive file requests. Please try again shortly.', resetAt: rateLimit.resetTime }, { status: 429 })
  try {
    const access = await getDriveFileAccess(user.id, fileId)
    if (!access) return NextResponse.json({ error: 'File not found.' }, { status: 404 })
    const driveUserId = access.accessUserId ?? access.ownerId
    if (!driveUserId) return NextResponse.json({ error: 'No connected Drive account can access this file.' }, { status: 409 })
    if (new URL(request.url).searchParams.get('download') === '1') {
      const response = await downloadDriveFile(driveUserId, fileId)
      return new NextResponse(response.body, { status: 200, headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' } })
    }
    return NextResponse.json({ file: await listDriveFile(driveUserId, fileId) })
  }
  catch (error) { console.error('[drive] file lookup failed:', error instanceof Error ? error.message : 'unknown error'); return NextResponse.json({ error: 'Google Drive lookup failed.' }, { status: 502 }) }
}
