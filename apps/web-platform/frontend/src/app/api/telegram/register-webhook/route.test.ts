// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

const SECRET = 'telegram-action-secret-for-tests'
const WEBHOOK_SECRET = 'telegram-webhook-secret-token-with-32-chars'

describe('Telegram webhook registration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.TELEGRAM_ACTION_SECRET = SECRET
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token-for-tests'
    process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = WEBHOOK_SECRET
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.test'
  })

  it('rejects missing or incorrect authorization without contacting Telegram', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const response = await POST(new Request('https://example.test/api/telegram/register-webhook', { method: 'POST' }))
    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed when the webhook secret is invalid', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = 'too-short'
    const response = await POST(new Request('https://example.test/api/telegram/register-webhook', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    }))
    expect(response.status).toBe(503)
  })

  it('registers only message and callback updates with Telegram', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, result: true }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await POST(new Request('https://example.test/api/telegram/register-webhook', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    }))
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.webhook_registered).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token-for-tests/setWebhook',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.test/api/telegram/webhook',
          secret_token: WEBHOOK_SECRET,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
        }),
      })
    )
  })

  it('does not expose Telegram API error details', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: false, description: 'private detail' }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await POST(new Request('https://example.test/api/telegram/register-webhook', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    }))
    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Telegram rejected the webhook registration.' })
  })
})
