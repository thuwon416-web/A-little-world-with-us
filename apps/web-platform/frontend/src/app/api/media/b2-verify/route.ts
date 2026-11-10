import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { isSameOriginRequest } from '@/lib/csrf'
import { verifyB2Upload, isB2Configured } from '@/lib/backblaze-b2'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const authorization = request.headers.get('authorization')
  const supabase = authorization
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } })
    : await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isB2Configured()) return NextResponse.json({ error: 'Large-media storage is not configured.' }, { status: 503 })
  const rate = await checkRateLimit('large-media-verify:' + user.id, 20, 60_000)
  if (!rate.allowed) return NextResponse.json({ error: 'Too many upload verification requests.' }, { status: 429 })
  const body = await request.json().catch(() => null) as { coupleId?: string; fileId?: string; objectName?: string; contentLength?: number; sha1?: string; expiresAt?: number; signature?: string } | null
  if (!body?.coupleId || !body.fileId || !body.objectName || !Number.isSafeInteger(body.contentLength) || !/^[a-f0-9]{40}$/i.test(body.sha1 ?? '') || !Number.isSafeInteger(body.expiresAt) || !body.signature) {
    return NextResponse.json({ error: 'Invalid upload verification request.' }, { status: 400 })
  }
  const { data: link } = await supabase.from('couple_links').select('id').eq('couple_id', body.coupleId).eq('status', 'accepted').or('inviter_id.eq.' + user.id + ',accepted_by.eq.' + user.id).maybeSingle()
  if (!link) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })
  try {
    const verified = await verifyB2Upload({
      fileId: body.fileId,
      objectName: body.objectName,
      signature: body.signature,
      expiresAt: body.expiresAt!,
      userId: user.id,
      coupleId: body.coupleId,
      contentLength: body.contentLength!,
      sha1: body.sha1!,
    })
    return verified ? NextResponse.json({ verified: true }) : NextResponse.json({ error: 'Uploaded object failed server verification and was removed.' }, { status: 403 })
  } catch {
    return NextResponse.json({ error: 'Unable to verify uploaded object.' }, { status: 502 })
  }
}
