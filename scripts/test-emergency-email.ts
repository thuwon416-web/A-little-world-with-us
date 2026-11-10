import { createEmailNotifier } from '../apps/web-platform/backend/supabase/functions/_shared/emailNotifier.ts'

const recipient = process.argv[2]?.trim()
if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  throw new Error('Usage: pnpm exec tsx scripts/test-emergency-email.ts <recipient-email>')
}

const notifier = createEmailNotifier((name) => process.env[name])
await notifier.sendEmergencyEmail({
  to: recipient,
  subject: 'A Little World With Us — emergency email delivery test',
  body: 'This is a test message to verify emergency-contact email delivery. No safety alert has been triggered.',
  metadata: { event: 'manual-delivery-test' },
})
process.stdout.write('Emergency email test sent successfully.\n')
