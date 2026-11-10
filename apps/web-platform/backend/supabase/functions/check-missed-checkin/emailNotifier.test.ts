import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { EmailProviderNotConfiguredError, sendEmergencyContactEmail } from './emailNotifier.ts'

Deno.test('email adapter fails explicitly when no provider is configured', async () => {
  try {
    await sendEmergencyContactEmail({ to: 'test@example.invalid', contactId: 'contact-1', checkinId: 'checkin-1' })
    throw new Error('expected adapter to reject')
  } catch (error) {
    assert(error instanceof EmailProviderNotConfiguredError)
    assertEquals(error.name, 'EmailProviderNotConfiguredError')
  }
})
