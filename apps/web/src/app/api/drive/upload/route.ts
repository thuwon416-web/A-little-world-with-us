import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile, uploadDriveFile } from '@/lib/google-drive'
import { validateUpload } from '@/lib/upload-validation'

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
  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A file is required.' }, { status: 400 })
  }
  const coupleId = typeof form.get('coupleId') === 'string' ? String(form.get('coupleId')) : ''
  if (!coupleId) {
    return NextResponse.json({ error: 'coupleId is required.' }, { status: 400 })
  }

  try {
    validateUpload(file)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid upload.' },
      { status: 400 }
    )
  }

  let driveFile: Awaited<ReturnType<typeof uploadDriveFile>> | null = null
  try {
    driveFile = await uploadDriveFile(user.id, file)

    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        couple_id: coupleId,
        image_url: null,
        storage_path: null,
        storage_provider: 'google_drive',
        drive_file_id: driveFile.id,
        mime_type: driveFile.mimeType || file.type || 'application/octet-stream',
        title: typeof form.get('title') === 'string' ? String(form.get('title')) : 'A memory together',
        caption: typeof form.get('caption') === 'string' ? String(form.get('caption')) : 'A memory together',
        date:
          typeof form.get('date') === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(String(form.get('date')))
            ? String(form.get('date'))
            : new Date().toISOString().slice(0, 10),
        category: typeof form.get('category') === 'string' ? String(form.get('category')) : 'favorite',
      })
      .select('id,created_at')
      .single()

    if (memoryError) {
      await deleteDriveFile(user.id, driveFile.id).catch(() => undefined)
      return NextResponse.json({ error: memoryError.message }, { status: 400 })
    }

    return NextResponse.json({ file: driveFile, memory })
  } catch (error) {
    if (driveFile) await deleteDriveFile(user.id, driveFile.id).catch(() => undefined)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Google Drive memory upload failed.' },
      { status: 502 }
    )
  }
}
