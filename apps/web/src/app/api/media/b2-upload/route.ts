import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { MAX_LARGE_MEDIA_SIZE, MAX_SHARED_DOCUMENT_SIZE } from '@/lib/upload-validation'
import { getB2UploadTarget, isB2Configured } from '@/lib/backblaze-b2'

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

  const rate = await checkRateLimit(`large-media:${user.id}`, 10, 60_000)
  if (!rate.allowed) return NextResponse.json({ error: 'Too many large-media uploads.' }, { status: 429 })

  const body = (await request.json().catch(() => ({}))) as {
    coupleId?: string
    fileName?: string
    contentType?: string
    contentLength?: number
    sha1?: string
  }
  const coupleId = body.coupleId?.trim() || ''
  const fileName = body.fileName?.trim() || ''
  const contentType = body.contentType?.trim() || 'application/octet-stream'
  const contentLength = Number(body.contentLength)
  const sha1 = body.sha1?.trim() || ''

  if (!coupleId || !fileName || !Number.isSafeInteger(contentLength) || contentLength <= MAX_SHARED_DOCUMENT_SIZE || contentLength > MAX_LARGE_MEDIA_SIZE || !/^[a-f0-9]{40}$/i.test(sha1)) {
    return NextResponse.json({ error: 'Invalid large-media upload request.' }, { status: 400 })
  }

  const { data: link } = await supabase
    .from('couple_links')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()
  if (!link) return NextResponse.json({ error: 'You are not a member of this couple.' }, { status: 403 })

  try {
    const target = await getB2UploadTarget({
      objectName: `couples/${coupleId}/large-media/${user.id}/${crypto.randomUUID()}-${fileName}`,
      contentType,
      contentLength,
      sha1,
    })
    return NextResponse.json({
      provider: 'backblaze_b2',
      bucket: process.env.B2_BUCKET_NAME,
      ...target,
    })
  } catch {
    return NextResponse.json({ error: 'Unable to prepare large-media storage.' }, { status: 502 })
  }
}
