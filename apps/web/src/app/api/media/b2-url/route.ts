import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { getB2DownloadUrl, isB2Configured } from '@/lib/backblaze-b2'

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
  if (!isB2Configured()) return NextResponse.json({ error: 'Large-media storage is not configured.' }, { status: 503 })

  const body = (await request.json().catch(() => ({}))) as { coupleId?: string; fileName?: string }
  if (!body.coupleId || !body.fileName) return NextResponse.json({ error: 'Invalid media request.' }, { status: 400 })

  const { data: link } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', body.coupleId)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()
  if (!link) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  try {
    return NextResponse.json({ url: await getB2DownloadUrl(body.fileName, 900) })
  } catch {
    return NextResponse.json({ error: 'Unable to authorize large-media download.' }, { status: 502 })
  }
}
