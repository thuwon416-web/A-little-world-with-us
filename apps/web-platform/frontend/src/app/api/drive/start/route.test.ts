import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

vi.mock('@/lib/google-drive', () => ({
  createOAuthState: vi.fn(() => 'signed-state'),
}))

import { GET } from './route'

describe('GET /api/drive/start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: null } })
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_DRIVE_REDIRECT_URI
  })

  it('returns 401 without an authenticated user', async () => {
    const response = await GET(new Request('http://localhost/api/drive/start'))
    expect(response.status).toBe(401)
  })

  it('returns 503 when Drive OAuth is not configured', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/start'))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Google Drive OAuth is not configured yet.' })
  })
})
