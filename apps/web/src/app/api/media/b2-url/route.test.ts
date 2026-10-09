import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUser, from, isSameOriginRequest, checkRateLimit, isB2Configured, getB2DownloadUrl } = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  isSameOriginRequest: vi.fn(),
  checkRateLimit: vi.fn(),
  isB2Configured: vi.fn(),
  getB2DownloadUrl: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser }, from }),
}))
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser }, from })),
}))
vi.mock('@/lib/csrf', () => ({ isSameOriginRequest }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }))
vi.mock('@/lib/backblaze-b2', () => ({ isB2Configured, getB2DownloadUrl }))

import { POST } from './route'

function request(body: unknown) {
  return new Request('https://a-little-world-with-us.vercel.app/api/media/b2-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/media/b2-url', () => {
  const maybeSingle = vi.fn()
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    or: vi.fn(() => query),
    maybeSingle,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    isB2Configured.mockReturnValue(true)
    checkRateLimit.mockResolvedValue({ allowed: true, resetTime: Date.now() + 60_000 })
    maybeSingle.mockResolvedValue({ data: { id: 'link-1' }, error: null })
    from.mockReturnValue(query)
    getB2DownloadUrl.mockResolvedValue('https://download.example/signed')
  })

  it('blocks cross-origin requests before authentication', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(request({ coupleId: 'couple-1', fileName: 'couples/couple-1/large-media/a.jpg' }))
    expect(response.status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('rejects NUL bytes in object names', async () => {
    const response = await POST(request({ coupleId: 'couple-1', fileName: 'couples/couple-1/large-media/a\\u0000.jpg' }))
    expect(response.status).toBe(400)
  })

  it('does not authorize a B2 object outside the requested couple prefix', async () => {
    const response = await POST(request({ coupleId: 'couple-1', fileName: 'couples/couple-2/large-media/a.jpg' }))
    expect(response.status).toBe(403)
    expect(getB2DownloadUrl).not.toHaveBeenCalled()
  })

  it('returns a short-lived URL for a correctly scoped object', async () => {
    const response = await POST(request({ coupleId: 'couple-1', fileName: 'couples/couple-1/large-media/user-1/a.jpg' }))
    expect(response.status).toBe(200)
    expect(getB2DownloadUrl).toHaveBeenCalledWith('couples/couple-1/large-media/user-1/a.jpg', 900)
  })
})
