import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { createPrivateCloudinaryUrl } from '@/lib/cloudinary-url'

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

export async function GET(request: Request) {
  const supabase = await getAuthenticatedClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memoryId = new URL(request.url).searchParams.get('memoryId')
  if (!memoryId) return NextResponse.json({ error: 'memoryId is required.' }, { status: 400 })

  const { data: memory, error } = await supabase
    .from('memories')
    .select('id,user_id,couple_id,storage_provider,cloudinary_public_id,mime_type')
    .eq('id', memoryId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Unable to load memory.' }, { status: 500 })
  if (!memory || memory.storage_provider !== 'cloudinary' || !memory.cloudinary_public_id) {
    return NextResponse.json({ error: 'Cloudinary memory not found.' }, { status: 404 })
  }

  const { data: link, error: linkError } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', memory.couple_id)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()

  if (linkError) return NextResponse.json({ error: 'Unable to verify couple access.' }, { status: 500 })
  if (!link) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  const format = memory.mime_type?.split('/')[1] || 'webp'
  return NextResponse.json({
    url: createPrivateCloudinaryUrl(memory.cloudinary_public_id, format),
  })
}
