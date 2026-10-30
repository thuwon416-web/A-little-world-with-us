import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  getCurrentMeteredCredential,
  getMeteredIceServers,
  getMeteredRedis,
  isIceServerArray,
} from '@/lib/metered-turn'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 })
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  const { data: coupleLink, error: coupleError } = await authClient
    .from('couple_links')
    .select('id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (coupleError || !coupleLink) {
    return NextResponse.json({ error: 'An accepted couple link is required.' }, { status: 403 })
  }

  const limit = await checkRateLimit(user.id, 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many TURN credential requests.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, Math.ceil((limit.resetTime - Date.now()) / 1000))) },
    })
  }

  const redis = getMeteredRedis()
  if (!redis) return NextResponse.json({ error: 'TURN credentials are not configured.' }, { status: 503 })

  try {
    const current = await getCurrentMeteredCredential(redis)
    if (!current) {
      return NextResponse.json({ error: 'TURN credentials are not ready.' }, { status: 503 })
    }
    const iceServers = await getMeteredIceServers(current.apiKey)
    if (!isIceServerArray(iceServers)) {
      return NextResponse.json({ error: 'Metered returned invalid ICE server configuration.' }, { status: 502 })
    }

    return NextResponse.json(
      { iceServers, expiresAt: current.expiresAt },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
    )
  } catch {
    return NextResponse.json({ error: 'TURN credentials are temporarily unavailable.' }, { status: 502 })
  }
}
