import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerClient, isSameOriginRequest } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  isSameOriginRequest: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient }))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))

import { POST } from './route'

describe('feedback CSRF protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(false)
  })

  it('rejects cross-origin feedback before creating a session client', async () => {
    const request = new Request('https://a-little-world-with-us.vercel.app/api/feedback', { method: 'POST', body: JSON.stringify({ feedback: 'test' }), headers: { 'Content-Type': 'application/json' } })
    const response = await POST(request as never)
    expect(response.status).toBe(403)
    expect(createServerClient).not.toHaveBeenCalled()
  })
})
