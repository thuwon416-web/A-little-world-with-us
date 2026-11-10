import { afterEach, describe, expect, it, vi } from 'vitest'
import { callEdgeFunction, validateCronRequest } from './cron-helpers'

afterEach(() => vi.unstubAllEnvs())

describe('validateCronRequest', () => {
  it('returns 500 when server-side cron configuration is missing', () => {
    vi.stubEnv('CRON_SECRET', '')
    vi.stubEnv('JOB_SECRET', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    expect(validateCronRequest(new Request('https://example.test'))).toMatchObject({ ok: false, response: { status: 500 } })
  })
  it('returns 401 for an incorrect bearer secret', () => {
    vi.stubEnv('CRON_SECRET', 'expected')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    expect(validateCronRequest(new Request('https://example.test', { headers: { authorization: 'Bearer wrong' } }))).toMatchObject({ ok: false, response: { status: 401 } })
  })
  it('accepts the correct bearer secret', () => {
    vi.stubEnv('CRON_SECRET', 'expected')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    expect(validateCronRequest(new Request('https://example.test', { headers: { authorization: 'Bearer expected' } }))).toMatchObject({ ok: true, supabaseUrl: 'https://example.supabase.co' })
  })
})

describe('callEdgeFunction', () => {
  it('forwards the configured secret using x-job-secret', async () => {
    vi.stubEnv('CRON_SECRET', 'outbound-test-secret')
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await callEdgeFunction('https://example.supabase.co', 'service-role-test', 'check-geofence')
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(requestInit.headers).get('x-job-secret')).toBe('outbound-test-secret')
    expect(new Headers(requestInit.headers).has('x-cron-secret')).toBe(false)
  })
})
