import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

function isAuthorized(req: Request): boolean {
  const secret = process.env.TELEGRAM_ACTION_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || !authorization?.startsWith('Bearer ')) return false

  const provided = Buffer.from(authorization.slice('Bearer '.length), 'utf8')
  const expected = Buffer.from(secret, 'utf8')
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function POST(req: Request) {
  if (!process.env.TELEGRAM_ACTION_SECRET) {
    return NextResponse.json({ error: 'Webhook setup authorization is not configured.' }, { status: 503 })
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN?.trim()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://a-little-world-with-us.vercel.app'

  if (!token || !secretToken || !/^[A-Za-z0-9_-]{32,256}$/.test(secretToken)) {
    return NextResponse.json({ error: 'Bot token or valid webhook secret is not configured.' }, { status: 503 })
  }

  const webhookUrl = new URL('/api/telegram/webhook', appUrl).toString()

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: false,
      }),
      cache: 'no-store',
    })

    const result = await response.json().catch(() => null)
    if (!response.ok || !result || result.ok !== true) {
      return NextResponse.json({ error: 'Telegram rejected the webhook registration.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true, webhook_registered: true, allowed_updates: ['message', 'callback_query'] })
  } catch {
    return NextResponse.json({ error: 'Unable to reach Telegram webhook API.' }, { status: 502 })
  }
}
