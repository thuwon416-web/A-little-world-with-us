import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { downloadDriveFile, listDriveFile } from '@/lib/google-drive'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fileId = new URL(request.url).searchParams.get('fileId')
  if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) return NextResponse.json({ error: 'Invalid fileId.' }, { status: 400 })
  try {
    if (new URL(request.url).searchParams.get('download') === '1') {
      const response = await downloadDriveFile(user.id, fileId)
      return new NextResponse(response.body, { status: 200, headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' } })
    }
    return NextResponse.json({ file: await listDriveFile(user.id, fileId) })
  }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Google Drive lookup failed.' }, { status: 502 }) }
}
