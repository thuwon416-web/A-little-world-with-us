import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, disconnectDrive, isSameOriginRequest } = vi.hoisted(() => ({
  getUser: vi.fn(),
  disconnectDrive: vi.fn(),
  isSameOriginRequest: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

vi.mock('@/lib/google-drive', () => ({
  disconnectDrive,
}))

vi.mock('@/lib/csrf', () => ({
  isSameOriginRequest,
}))

import { POST } from './route'

describe('POST /api/drive/disconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSameOriginRequest.mockReturnValue(true)
    getUser.mockResolvedValue({ data: { user: null } })
  })

  it('blocks cross-origin requests before touching the session', async () => {
    isSameOriginRequest.mockReturnValue(false)
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/disconnect', { method: 'POST' }))
    expect(response.status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/disconnect', { method: 'POST' }))
    expect(response.status).toBe(401)
  })

  it('disconnects the authenticated account', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    disconnectDrive.mockResolvedValue(undefined)
    const response = await POST(new Request('https://a-little-world-with-us.vercel.app/api/drive/disconnect', { method: 'POST' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ connected: false })
    expect(disconnectDrive).toHaveBeenCalledWith('user-1')
  })
})
