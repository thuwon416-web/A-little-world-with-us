import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEmailNotifier,
  EmailProviderNotConfiguredError,
  NoopNotifier,
} from '../../../backend/supabase/functions/_shared/emailNotifier'

afterEach(() => vi.restoreAllMocks())

const env = (values: Record<string, string>) => (name: string) => values[name]

describe('createEmailNotifier', () => {
  it('defaults to Resend and fails at startup when the API key is missing', () => {
    expect(() => createEmailNotifier(env({ EMERGENCY_EMAIL_FROM: 'alerts@example.invalid' })))
      .toThrow(EmailProviderNotConfiguredError)
  })

  it('requires a sender address for the Resend provider', () => {
    expect(() => createEmailNotifier(env({ RESEND_API_KEY: 'test-api-key' })))
      .toThrow('requires EMERGENCY_EMAIL_FROM')
  })

  it('offers a throwing no-op adapter for tests only', async () => {
    const notifier = new NoopNotifier()
    expect(notifier).toBeInstanceOf(NoopNotifier)
    await expect(notifier.sendEmergencyEmail({ to: 'test@example.invalid', subject: 'test', body: 'test', metadata: {} }))
      .rejects.toThrow(EmailProviderNotConfiguredError)
  })

  it('does not allow the test-only no-op adapter to be selected by environment', () => {
    expect(() => createEmailNotifier(env({ EMAIL_PROVIDER: 'noop' }))).toThrow('Unsupported EMAIL_PROVIDER')
  })

  it('rejects unknown providers', () => {
    expect(() => createEmailNotifier(env({ EMAIL_PROVIDER: 'unknown' })))
      .toThrow('Unsupported EMAIL_PROVIDER')
  })
})

describe('ResendNotifier', () => {
  it('sends an emergency email through Resend without logging the recipient', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const log = vi.spyOn(console, 'log')
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const notifier = createEmailNotifier(env({ RESEND_API_KEY: 'test-api-key', EMERGENCY_EMAIL_FROM: 'alerts@example.invalid' }), fetcher)

    await notifier.sendEmergencyEmail({
      to: 'contact@example.invalid',
      subject: 'Missed safety check-in',
      body: 'Please check on your partner.',
      metadata: { contact_id: 'contact-1', checkin_id: 'checkin-1' },
    })

    expect(fetcher).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({ method: 'POST' }))
    const request = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as { to: string[]; text: string }
    expect(request.to).toEqual(['contact@example.invalid'])
    expect(request.text).toContain('Please check on your partner.')
    for (const logger of [log, warn, error]) {
      expect(logger.mock.calls.flat().join(' ')).not.toContain('@')
    }
  })

  it('throws on non-2xx responses so the caller can retry', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 503 }))
    const notifier = createEmailNotifier(env({ RESEND_API_KEY: 'test-api-key', EMERGENCY_EMAIL_FROM: 'alerts@example.invalid' }), fetcher)
    await expect(notifier.sendEmergencyEmail({ to: 'contact@example.invalid', subject: 'test', body: 'test', metadata: {} }))
      .rejects.toMatchObject({ name: 'ResendApiError', status: 503 })
  })
})
