import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateCronRequest } from './cron-helpers'

afterEach(() => vi.unstubAllEnvs())

describe('validateCronRequest', () => {
  it('returns 401 when the configured secret is missing', () => {
    vi.stubEnv('CRON_SECRET', '')
    vi.stubEnv('JOB_SECRET', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    expect(validateCronRequest(new Request('https://example.test'))).toMatchObject({ ok: false, response: { status: 401 } })
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
