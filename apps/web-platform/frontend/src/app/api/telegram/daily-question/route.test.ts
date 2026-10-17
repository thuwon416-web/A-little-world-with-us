// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendTelegramMessage } = vi.hoisted(() => ({
  sendTelegramMessage: vi.fn(),
}))

vi.mock('@/lib/telegram', () => ({ sendTelegramMessage }))

import { GET, POST } from './route'

const SECRET = 'a-dedicated-test-secret-with-enough-entropy'

describe('Telegram daily question gateway authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_ACTION_SECRET = SECRET
    process.env.NEXT_PUBLIC_APP_URL = 'https://a-little-world-with-us.vercel.app'
    sendTelegramMessage.mockResolvedValue({ ok: true })
  })

  it('fails closed when the gateway secret is not configured', async () => {
    delete process.env.TELEGRAM_ACTION_SECRET
    const request = new Request('https://example.test/api/telegram/daily-question')

    const response = await GET(request)

    expect(response.status).toBe(503)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated POST requests before sending a message', async () => {
    const request = new Request('https://example.test/api/telegram/daily-question', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-secret' },
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('allows an authenticated gateway request', async () => {
    const request = new Request('https://example.test/api/telegram/daily-question', {
      headers: { Authorization: `Bearer ${SECRET}` },
    })

    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.status).toBe('success')
    expect(sendTelegramMessage).toHaveBeenCalledTimes(1)
  })
})
