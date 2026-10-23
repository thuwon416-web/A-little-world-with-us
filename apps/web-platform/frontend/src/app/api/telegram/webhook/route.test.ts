// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendTelegramMessage } = vi.hoisted(() => ({
  sendTelegramMessage: vi.fn(),
}))

vi.mock('@/lib/telegram', () => ({ sendTelegramMessage }))

import { POST } from './route'

const SECRET = 'telegram-webhook-secret-token-for-tests'
const allowedRequest = (body: unknown, token = SECRET) =>
  new Request('https://example.test/api/telegram/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': token,
    },
    body: JSON.stringify(body),
  })

describe('Telegram webhook security and commands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = SECRET
    process.env.TELEGRAM_ALLOWED_USER_IDS = '123456789,987654321'
    process.env.TELEGRAM_ENABLED = 'true'
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
  })

  it('fails closed when the webhook token or allowlist is missing', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN
    const response = await POST(allowedRequest({ message: { text: '/status', from: { id: 123456789 }, chat: { id: 123456789 } } }))
    expect(response.status).toBe(503)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('rejects requests without the correct Telegram secret header', async () => {
    const response = await POST(allowedRequest({ message: { text: '/status', from: { id: 123456789 }, chat: { id: 123456789 } } }, 'wrong-token'))
    expect(response.status).toBe(401)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('rejects non-allowlisted Telegram users', async () => {
    const response = await POST(allowedRequest({ message: { text: '/status', from: { id: 555555555 }, chat: { id: 555555555 } } }))
    expect(response.status).toBe(403)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('sends replies to the originating chat and does not claim unverified sync', async () => {
    sendTelegramMessage.mockResolvedValue({ ok: true })
    const response = await POST(allowedRequest({
      message: { text: '/status', from: { id: 123456789 }, chat: { id: 123456789 } },
    }))
    expect(response.status).toBe(200)
    expect(sendTelegramMessage).toHaveBeenCalledWith(
      expect.stringContaining('does not independently verify database or media sync.'),
      expect.objectContaining({ chatId: 123456789 })
    )
  })

  it('does not falsely claim that /spend wrote to the database', async () => {
    sendTelegramMessage.mockResolvedValue({ ok: true })
    const response = await POST(allowedRequest({
      message: { text: '/spend 25000 dinner', from: { id: 123456789 }, chat: { id: 123456789 } },
    }))
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload.command).toBe('spend_redirected')
    expect(sendTelegramMessage).toHaveBeenCalledWith(
      expect.stringContaining('database ထဲသို့ တိုက်ရိုက်မရေးသေးပါ။'),
      expect.objectContaining({ chatId: 123456789 })
    )
  })
})
