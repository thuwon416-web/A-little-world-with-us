import { NextResponse } from 'next/server'
import {
  getCurrentMeteredCredential,
  getMeteredAppUrl,
  getMeteredRedis,
  getPendingMeteredCredential,
  meteredCredentialTtlSeconds,
  promotePendingMeteredCredential,
  type MeteredTurnCredential,
} from '@/lib/metered-turn'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const appUrl = getMeteredAppUrl()
  const secretKey = process.env.METERED_SECRET_KEY?.trim()
  const redis = getMeteredRedis()
  if (!appUrl || !secretKey) {
    return NextResponse.json({ status: 'skipped', reason: 'metered-provider-not-configured' })
  }
  if (!redis) {
    return NextResponse.json({ error: 'Redis is not configured for TURN rotation.' }, { status: 503 })
  }

  const lock = await redis.set('turn:metered:rotation-lock:v1', String(Date.now()), { nx: true, ex: 90 })
  if (!lock) return NextResponse.json({ status: 'already-running' }, { status: 202 })

  try {
    // Promote the previous rotation first if it has completed its propagation window.
    await promotePendingMeteredCredential(redis)
    const existingPending = await getPendingMeteredCredential(redis)
    if (existingPending && existingPending.availableAt > Date.now()) {
      return NextResponse.json({
        status: 'pending',
        availableAt: new Date(existingPending.availableAt).toISOString(),
        expiresAt: new Date(existingPending.expiresAt).toISOString(),
      })
    }
    const current = await getCurrentMeteredCredential(redis)
    if (current && Date.now() - current.createdAt < 20 * 60 * 60_000) {
      return NextResponse.json({ status: 'already-current', expiresAt: new Date(current.expiresAt).toISOString() })
    }

    const endpoint = new URL('/api/v1/turn/credential', appUrl)
    endpoint.searchParams.set('secretKey', secretKey)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expiryInSeconds: meteredCredentialTtlSeconds,
        label: 'a-little-world-with-us-production',
      }),
      cache: 'no-store',
    })
    if (!response.ok) {
      // Do not include provider response text: it may contain sensitive request context.
      return NextResponse.json({ error: 'Metered TURN credential creation failed.' }, { status: 502 })
    }

    const payload = await response.json() as { apiKey?: unknown; username?: unknown }
    if (
      typeof payload.apiKey !== 'string' || payload.apiKey.length < 16 || payload.apiKey.length > 256 ||
      typeof payload.username !== 'string' || payload.username.length < 1 || payload.username.length > 256
    ) {
      return NextResponse.json({ error: 'Metered returned an invalid TURN credential.' }, { status: 502 })
    }

    const now = Date.now()
    const credential: MeteredTurnCredential = {
      apiKey: payload.apiKey,
      username: payload.username,
      createdAt: now,
      // Metered documents up to 2 minutes for global credential propagation.
      availableAt: now + 3 * 60_000,
      expiresAt: now + meteredCredentialTtlSeconds * 1000,
    }
    await redis.set('turn:metered:credential:pending:v1', credential, {
      ex: meteredCredentialTtlSeconds,
    })

    return NextResponse.json({
      status: 'pending',
      availableAt: new Date(credential.availableAt).toISOString(),
      expiresAt: new Date(credential.expiresAt).toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'TURN credential rotation failed.' }, { status: 502 })
  } finally {
    await redis.del('turn:metered:rotation-lock:v1').catch(() => undefined)
  }
}
