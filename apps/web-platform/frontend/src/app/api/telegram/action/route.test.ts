// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendTelegramMessage } = vi.hoisted(() => ({
  sendTelegramMessage: vi.fn(),
}))

vi.mock('@/lib/telegram', () => ({ sendTelegramMessage }))

import { POST } from './route'

const SECRET = 'a-dedicated-test-secret-with-enough-entropy'

describe('Telegram action gateway authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_ACTION_SECRET = SECRET
  })

  it('fails closed when the gateway secret is not configured', async () => {
    delete process.env.TELEGRAM_ACTION_SECRET
    const request = new Request('https://example.test/api/telegram/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'world_korean_quiz' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(503)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('rejects missing or incorrect bearer credentials before parsing the action', async () => {
    const request = new Request('https://example.test/api/telegram/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'world_korean_quiz' }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer wrong-secret' },
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(sendTelegramMessage).not.toHaveBeenCalled()
  })

  it('accepts the configured gateway secret and dispatches a supported action', async () => {
    sendTelegramMessage.mockResolvedValue({ ok: true })
    const request = new Request('https://example.test/api/telegram/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'world_open_memories' }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.action).toBe('memories_link_sent')
    expect(sendTelegramMessage).toHaveBeenCalledTimes(1)
  })
})
