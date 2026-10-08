import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { deleteDriveFile } from '@/lib/google-drive'
import { deleteCloudinaryAsset } from '@/lib/cloudinary'
import { isSameOriginRequest } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/rate-limit'

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
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimit = await checkRateLimit(`memory-delete:${user.id}`, 10, 60_000)
  if (!rateLimit.allowed) return NextResponse.json({ error: 'Too many memory deletion requests. Please try again shortly.', resetAt: rateLimit.resetTime }, { status: 429 })

  const body = (await request.json().catch(() => ({}))) as { memoryId?: string }
  if (!body.memoryId) return NextResponse.json({ error: 'memoryId is required.' }, { status: 400 })

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .select('id,user_id,couple_id,storage_provider,storage_path,image_url,drive_file_id,cloudinary_asset_id')
    .eq('id', body.memoryId)
    .maybeSingle()

  if (memoryError) return NextResponse.json({ error: 'Unable to load memory.' }, { status: 500 })
  if (!memory) return NextResponse.json({ error: 'Memory not found.' }, { status: 404 })
  if (memory.user_id !== user.id) return NextResponse.json({ error: 'You can only delete memories you created.' }, { status: 403 })

  try {
    if (memory.storage_provider === 'google_drive' && memory.drive_file_id) {
      await deleteDriveFile(user.id, memory.drive_file_id)
    } else if (memory.storage_provider === 'cloudinary' && memory.cloudinary_asset_id) {
      await deleteCloudinaryAsset(memory.cloudinary_asset_id)
    } else if (memory.storage_provider === 'supabase' && memory.storage_path) {
      const { error } = await supabase.storage.from('memories').remove([memory.storage_path])
      if (error) throw error
    }

    const { error: deleteError } = await supabase
      .from('memories')
      .delete()
      .eq('id', memory.id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Memory asset deletion failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Memory deletion failed.' }, { status: 502 })
  }
}
