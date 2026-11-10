import { describe, expect, it } from 'vitest'
import { EmailProviderNotConfiguredError, sendEmergencyContactEmail } from '../../../backend/supabase/functions/check-missed-checkin/emailNotifier'

describe('emergency contact email adapter', () => {
  it('fails explicitly when no provider is configured', async () => {
    await expect(sendEmergencyContactEmail({ to: 'test@example.invalid', contactId: 'contact-1', checkinId: 'checkin-1' }))
      .rejects.toBeInstanceOf(EmailProviderNotConfiguredError)
  })
})
