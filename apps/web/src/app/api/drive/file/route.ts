import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { downloadDriveFile, getDriveFileAccess, listDriveFile } from '@/lib/google-drive'

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
  try {
    const access = await getDriveFileAccess(user.id, fileId)
    if (!access) return NextResponse.json({ error: 'File not found.' }, { status: 404 })
    if (new URL(request.url).searchParams.get('download') === '1') {
      const response = await downloadDriveFile(access.ownerId, fileId)
      return new NextResponse(response.body, { status: 200, headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' } })
    }
    return NextResponse.json({ file: await listDriveFile(access.ownerId, fileId) })
  }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Google Drive lookup failed.' }, { status: 502 }) }
}
