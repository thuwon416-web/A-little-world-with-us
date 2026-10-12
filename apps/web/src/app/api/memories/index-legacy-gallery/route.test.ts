import { beforeEach, describe, expect, it, vi } from 'vitest'

const { isSameOriginRequest, getUser } = vi.hoisted(() => ({
  isSameOriginRequest: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))
vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

import { POST } from './route'

describe('POST /api/memories/index-legacy-gallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  it('rejects cross-origin requests before touching auth or storage', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(new Request('https://example.com/api/memories/index-legacy-gallery', { method: 'POST' }))
    expect(response.status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated requests', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/memories/index-legacy-gallery', { method: 'POST' }))
    expect(response.status).toBe(401)
  })
})
