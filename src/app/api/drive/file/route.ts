import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { listDriveFile } from '@/lib/google-drive'

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const fileId = new URL(request.url).searchParams.get('fileId')
  if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) return NextResponse.json({ error: 'Invalid fileId.' }, { status: 400 })
  try { return NextResponse.json({ file: await listDriveFile(user.id, fileId) }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Google Drive lookup failed.' }, { status: 502 }) }
}
