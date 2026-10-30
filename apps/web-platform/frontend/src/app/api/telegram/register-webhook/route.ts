import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

const TELEGRAM_API_BASE = 'https://api.telegram.org'

type TelegramWebhookInfo = {
  url?: unknown
  pending_update_count?: unknown
  last_error_date?: unknown
  allowed_updates?: unknown
}

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

    // Verify Telegram's persisted webhook configuration after setWebhook.
    // Keep this response secret-free: never return the bot token or webhook secret.
    let webhookInfoVerified = false
    let webhookUrlMatches = false
    let pendingUpdateCount: number | null = null
    let lastErrorDate: number | null = null
    let allowedUpdates: string[] = []

    try {
      const infoResponse = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getWebhookInfo`, {
        method: 'GET',
        cache: 'no-store',
      })
      const infoPayload = await infoResponse.json().catch(() => null) as {
        ok?: boolean
        result?: TelegramWebhookInfo
      } | null
      const info = infoPayload?.result

      if (infoResponse.ok && infoPayload?.ok === true && info && typeof info === 'object') {
        webhookInfoVerified = true
        webhookUrlMatches = info.url === webhookUrl
        pendingUpdateCount = Number.isSafeInteger(info.pending_update_count)
          ? info.pending_update_count as number
          : null
        lastErrorDate = Number.isSafeInteger(info.last_error_date)
          ? info.last_error_date as number
          : null
        allowedUpdates = Array.isArray(info.allowed_updates)
          ? info.allowed_updates.filter((value): value is string => typeof value === 'string')
          : []
      }
    } catch {
      // Registration succeeded; report that post-registration verification was unavailable.
    }

    return NextResponse.json({
      ok: true,
      webhook_registered: true,
      allowed_updates: ['message', 'callback_query'],
      webhook_info_verified: webhookInfoVerified,
      webhook_url_matches: webhookInfoVerified && webhookUrlMatches,
      pending_update_count: pendingUpdateCount,
      last_error_date: lastErrorDate,
      has_last_delivery_error: lastErrorDate !== null,
      telegram_allowed_updates: allowedUpdates,
      required_updates_enabled: ['message', 'callback_query'].every((value) => allowedUpdates.includes(value)),
    })
  } catch {
    return NextResponse.json({ error: 'Unable to reach Telegram webhook API.' }, { status: 502 })
  }
}
