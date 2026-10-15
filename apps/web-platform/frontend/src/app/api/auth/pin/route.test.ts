import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, checkRateLimit, isSameOriginRequest } = vi.hoisted(() => ({
  getUser: vi.fn(),
  checkRateLimit: vi.fn(),
  isSameOriginRequest: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit,
}))

vi.mock('@/lib/csrf', () => ({
  isSameOriginRequest,
}))

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

import { POST } from './route'

function request(body: unknown) {
  return new Request('https://a-little-world-with-us.vercel.app/api/auth/pin', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

describe('POST /api/auth/pin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: null } })
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetTime: Date.now() + 60000 })
  })

  it('blocks cross-origin requests', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(request({ action: 'verify', pin: '1234' }))
    expect(response.status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await POST(request({ action: 'verify', pin: '1234' }))
    expect(response.status).toBe(401)
  })

  it('rate-limits PIN verification before reading stored credentials', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: 123 })
    const response = await POST(request({ action: 'verify', pin: '1234' }))
    expect(response.status).toBe(429)
  })

  it('rejects invalid PIN input before database access', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const response = await POST(request({ action: 'verify', pin: '12' }))
    expect(response.status).toBe(400)
  })
})
