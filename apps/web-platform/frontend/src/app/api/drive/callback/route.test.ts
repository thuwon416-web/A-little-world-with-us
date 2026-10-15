import { describe, expect, it, vi, beforeEach } from 'vitest'

const { getUser, cookieGet, cookieDelete, exchangeCode, saveConnection, parseOAuthState, verifyOAuthState } = vi.hoisted(() => ({
  getUser: vi.fn(),
  cookieGet: vi.fn(),
  cookieDelete: vi.fn(),
  exchangeCode: vi.fn(),
  saveConnection: vi.fn(),
  parseOAuthState: vi.fn(),
  verifyOAuthState: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet, delete: cookieDelete }),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerClient: async () => ({ auth: { getUser } }),
}))

vi.mock('@/lib/google-drive', () => ({
  exchangeCode,
  saveConnection,
  parseOAuthState,
  verifyOAuthState,
}))

import { GET } from './route'

describe('GET /api/drive/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    cookieGet.mockReturnValue({ value: 'signed-state' })
    parseOAuthState.mockReturnValue({ userId: 'user-1', exp: Date.now() + 60_000, returnOrigin: 'https://a-little-world-with-us.vercel.app' })
    verifyOAuthState.mockReturnValue(true)
    exchangeCode.mockResolvedValue({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 })
    saveConnection.mockResolvedValue(undefined)
  })

  it('rejects a callback when the state cookie is missing or mismatched', async () => {
    cookieGet.mockReturnValue(undefined)
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/callback?code=code&state=signed-state'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/settings?drive=error')
    expect(exchangeCode).not.toHaveBeenCalled()
  })

  it('exchanges a valid callback and redirects to Connected', async () => {
    const response = await GET(new Request('https://a-little-world-with-us.vercel.app/api/drive/callback?code=code&state=signed-state'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://a-little-world-with-us.vercel.app/settings?drive=connected')
    expect(exchangeCode).toHaveBeenCalledWith('code')
    expect(saveConnection).toHaveBeenCalledWith('user-1', expect.objectContaining({ access_token: 'access' }))
    expect(response.headers.get('set-cookie')).toContain('drive_oauth_state=')
  })
})
