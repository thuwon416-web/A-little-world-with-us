import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, getDriveConnectionInfo } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getDriveConnectionInfo: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: { getUser } })),
}))

vi.mock('@/lib/google-drive', () => ({
  getDriveConnectionInfo,
}))

import { GET } from './route'

describe('GET /api/drive/status', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: null } })
    getDriveConnectionInfo.mockResolvedValue({ connected: true, scope: 'https://www.googleapis.com/auth/drive', rootFolderId: null })
  })

  it('returns 401 without an authenticated user', async () => {
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/status'))
    expect(response.status).toBe(401)
  })

  it('reports connected when the stored Drive token can be resolved', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/status'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ connected: true, scope: 'https://www.googleapis.com/auth/drive', rootFolderId: null, requiresReauthorization: false })
    expect(getDriveConnectionInfo).toHaveBeenCalledWith('user-1')
  })

  it('reports disconnected when the stored token is unavailable or invalid', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    getDriveConnectionInfo.mockRejectedValue(new Error('token unavailable'))
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/status'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ connected: false })
  })
})
