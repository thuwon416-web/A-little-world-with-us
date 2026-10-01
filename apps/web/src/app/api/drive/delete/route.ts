import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile, getDriveFileAccess } from '@/lib/google-drive'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json().catch(() => null)) as { fileId?: string } | null
  const fileId = body?.fileId
  if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) return NextResponse.json({ error: 'Invalid fileId.' }, { status: 400 })
  try {
    const access = await getDriveFileAccess(user.id, fileId)
    if (!access) return NextResponse.json({ error: 'File not found.' }, { status: 404 })
    if (!access.canDelete) return NextResponse.json({ error: 'Only the memory owner can delete this file.' }, { status: 403 })
    await deleteDriveFile(access.ownerId, fileId)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Google Drive file deletion failed.' }, { status: 502 })
  }
}
