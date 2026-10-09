import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClient, isSameOriginRequest } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  isSameOriginRequest: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))

import { DELETE, POST } from './route'

function request(method: 'POST' | 'DELETE') {
  return new Request('https://a-little-world-with-us.vercel.app/api/notifications/push-subscription', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

describe('push subscription CSRF protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(false)
  })

  it('rejects cross-origin subscribe requests before creating a session client', async () => {
    const response = await POST(request('POST') as never)
    expect(response.status).toBe(403)
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('rejects cross-origin unsubscribe requests before creating a session client', async () => {
    const response = await DELETE(request('DELETE') as never)
    expect(response.status).toBe(403)
    expect(createServerClient).not.toHaveBeenCalled()
  })
})
