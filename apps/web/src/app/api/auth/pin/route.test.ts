import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const { cookieSet, setSessionCookies } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

  return {
    cookieSet: vi.fn(),
    setSessionCookies: vi.fn(),
  }
})

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: cookieSet,
  }),
}))

vi.mock('server-only', () => ({}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _anonKey: string,
    options: {
      cookies: {
        getAll: () => unknown[]
        setAll: (cookies: Array<{
          name: string
          value: string
          options: { path: string; httpOnly: boolean }
        }>) => void
      }
    }
  ) => {
    setSessionCookies.mockImplementation(() => {
      options.cookies.setAll([
        {
          name: 'sb-access-token',
          value: 'refreshed-session',
          options: { path: '/', httpOnly: true },
        },
      ])
    })

    return {
      auth: {
        getUser: async () => {
          setSessionCookies()
          return { data: { user: null } }
        },
      },
    }
  },
}))

import { POST } from './route'

function makeRequest(): NextRequest {
  return new Request('http://localhost/api/auth/pin', {
    method: 'POST',
    headers: { Origin: 'http://localhost' },
    body: JSON.stringify({ action: 'status' }),
  }) as NextRequest
}

describe('POST /api/auth/pin session cookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('persists refreshed Supabase cookies and preserves unauthorized response', async () => {
    const response = await POST(makeRequest())

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(cookieSet).toHaveBeenCalledWith(
      'sb-access-token',
      'refreshed-session',
      { path: '/', httpOnly: true }
    )
  })
})
