import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { uploadDriveFile } from '@/lib/google-drive'
import { validateUpload } from '@/lib/upload-validation'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const authorization = request?.headers.get('authorization')
  const supabase = authorization
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } })
    : await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'A file is required.' }, { status: 400 })
  try { validateUpload(file) } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid upload.' }, { status: 400 }) }
  try {
    const result = await uploadDriveFile(user.id, file, typeof form.get('folderId') === 'string' ? String(form.get('folderId')) : undefined)
    return NextResponse.json({ file: result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Google Drive upload failed.' }, { status: 502 })
  }
}
