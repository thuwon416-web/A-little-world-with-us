import { createEmailNotifier } from '../apps/web-platform/backend/supabase/functions/_shared/emailNotifier.ts'

const recipient = Deno.args[0]?.trim()
if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  throw new Error('Usage: deno run --allow-env=EMAIL_PROVIDER,RESEND_API_KEY,EMERGENCY_EMAIL_FROM --allow-net=api.resend.com scripts/test-emergency-email.ts <recipient-email>')
}

const notifier = createEmailNotifier((name) => Deno.env.get(name))
await notifier.sendEmergencyEmail({
  to: recipient,
  subject: 'A Little World With Us — emergency email delivery test',
  body: 'This is a test message to verify emergency-contact email delivery. No safety alert has been triggered.',
  metadata: { event: 'manual-delivery-test' },
})
console.info('Emergency email test sent successfully.')
