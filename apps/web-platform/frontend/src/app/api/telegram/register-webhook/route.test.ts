// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

const SECRET = 'telegram-action-secret-for-tests'
const WEBHOOK_SECRET = 'telegram-webhook-secret-token-with-32-chars'
const WEBHOOK_URL = 'https://example.test/api/telegram/webhook'

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

  it('registers and verifies the persisted Telegram webhook configuration', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ ok: true, result: true }))
      .mockResolvedValueOnce(Response.json({
        ok: true,
        result: {
          url: WEBHOOK_URL,
          pending_update_count: 0,
          allowed_updates: ['message', 'callback_query'],
        },
      }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(new Request('https://example.test/api/telegram/register-webhook', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      webhook_registered: true,
      webhook_info_verified: true,
      webhook_url_matches: true,
      pending_update_count: 0,
      last_error_date: null,
      has_last_delivery_error: false,
      telegram_allowed_updates: ['message', 'callback_query'],
      required_updates_enabled: true,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.telegram.org/botbot-token-for-tests/setWebhook',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          url: WEBHOOK_URL,
          secret_token: WEBHOOK_SECRET,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
        }),
      })
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.telegram.org/botbot-token-for-tests/getWebhookInfo',
      expect.objectContaining({ method: 'GET', cache: 'no-store' })
    )
    expect(JSON.stringify(payload)).not.toContain('bot-token-for-tests')
    expect(JSON.stringify(payload)).not.toContain(WEBHOOK_SECRET)
  })

  it('reports registration success without claiming verification when getWebhookInfo fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ ok: true, result: true }))
      .mockResolvedValueOnce(Response.json({ ok: false }, { status: 502 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(new Request('https://example.test/api/telegram/register-webhook', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
    }))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.webhook_registered).toBe(true)
    expect(payload.webhook_info_verified).toBe(false)
    expect(payload.webhook_url_matches).toBe(false)
    expect(payload.required_updates_enabled).toBe(false)
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
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
