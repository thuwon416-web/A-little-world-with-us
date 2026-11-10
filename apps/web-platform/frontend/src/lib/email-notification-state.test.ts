import { describe, expect, it, vi } from 'vitest'
import type { EmailNotifier } from '../../../backend/supabase/functions/_shared/emailNotifier'
import { deliverEmergencyEmail } from '../../../backend/supabase/functions/check-missed-checkin/email-notification-state'

const email = { to: 'contact@example.invalid', subject: 'Missed check-in', body: 'Please check on your partner.', metadata: { contact_id: 'contact-1' } }

describe('deliverEmergencyEmail', () => {
  it('returns delivered only after the provider confirms success', async () => {
    const notifier: EmailNotifier = { sendEmergencyEmail: vi.fn().mockResolvedValue(undefined) }
    await expect(deliverEmergencyEmail(notifier, email, 1)).resolves.toEqual({ status: 'delivered', attempts: 1, lastError: null })
    expect(notifier.sendEmergencyEmail).toHaveBeenCalledWith(email)
  })

  it('returns pending after a provider failure so the outbox retries', async () => {
    const notifier: EmailNotifier = { sendEmergencyEmail: vi.fn().mockRejectedValue(new Error('temporary')) }
    await expect(deliverEmergencyEmail(notifier, email, 2)).resolves.toEqual({ status: 'pending', attempts: 2, lastError: 'Error' })
  })

  it('sanitizes non-Error provider rejections into a retryable error code', async () => {
    const notifier: EmailNotifier = { sendEmergencyEmail: vi.fn().mockRejectedValue('transport failure') }
    await expect(deliverEmergencyEmail(notifier, email, 1)).resolves.toEqual({ status: 'pending', attempts: 1, lastError: 'unknown_error' })
  })

  it('marks the final failed attempt as failed', async () => {
    const notifier: EmailNotifier = { sendEmergencyEmail: vi.fn().mockRejectedValue(new Error('permanent')) }
    await expect(deliverEmergencyEmail(notifier, email, 5)).resolves.toEqual({ status: 'failed', attempts: 5, lastError: 'Error' })
  })
})
