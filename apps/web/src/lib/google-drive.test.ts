import { createCipheriv, randomBytes } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))

vi.mock('@supabase/supabase-js', () => ({ createClient }))

import {
  createOAuthState,
  exchangeCode,
  getDriveAccessToken,
  parseOAuthState,
} from './google-drive'

describe('google-drive helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_OAUTH_STATE_SECRET = 'test-state-secret'
    process.env.GOOGLE_CLIENT_ID = 'client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret'
    process.env.GOOGLE_DRIVE_REDIRECT_URI = 'https://a-little-world-with-us.vercel.app/api/drive/callback'
    process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  })

  it('creates and validates signed OAuth state, including expiry', () => {
    const state = createOAuthState('user-1', 'https://a-little-world-with-us.vercel.app')
    expect(parseOAuthState(state)).toMatchObject({ userId: 'user-1', returnOrigin: 'https://a-little-world-with-us.vercel.app' })

    const [payload, signature] = state.split('.')
    const tampered = `${payload}.${signature.slice(0, -1)}x`
    expect(parseOAuthState(tampered)).toBeNull()
  })

  it('rejects malformed Google token responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400, headers: { 'content-type': 'application/json' } }),
    ))

    await expect(exchangeCode('bad-code')).rejects.toThrow('Google OAuth token exchange failed.')
  })

  it('fails closed when an expired connection has no refresh token', async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          user_id: 'user-1',
          access_token_enc: 'not-a-valid-token',
          access_token_iv: 'not-a-valid-iv',
          refresh_token_enc: null,
          refresh_token_iv: null,
          expires_at: new Date(Date.now() - 60_000).toISOString(),
        },
        error: null,
      }),
    }
    createClient.mockReturnValue({ from: vi.fn(() => query) })

    await expect(getDriveAccessToken('user-1')).rejects.toThrow('Google Drive connection needs to be reconnected.')
  })

  it('does not accept a provider error as a successful refresh', async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          user_id: 'user-1',
          access_token_enc: 'not-a-valid-token',
          access_token_iv: 'not-a-valid-iv',
          refresh_token_enc: 'invalid-encrypted-refresh',
          refresh_token_iv: 'invalid-iv',
          expires_at: new Date(Date.now() - 60_000).toISOString(),
        },
        error: null,
      }),
    }
    createClient.mockReturnValue({ from: vi.fn(() => query) })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400, headers: { 'content-type': 'application/json' } }),
    ))

    await expect(getDriveAccessToken('user-1')).rejects.toThrow()
  })
})
