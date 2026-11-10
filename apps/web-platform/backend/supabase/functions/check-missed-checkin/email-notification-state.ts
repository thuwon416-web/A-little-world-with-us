import type { EmailNotifier, EmergencyEmailInput } from '../_shared/emailNotifier.ts'
import { getNotificationRetryState } from './notification-state.ts'

export async function deliverEmergencyEmail(
  notifier: EmailNotifier,
  input: EmergencyEmailInput,
  attempts: number,
) {
  try {
    await notifier.sendEmergencyEmail(input)
    return { status: 'delivered' as const, attempts, lastError: null }
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : 'unknown_error'
    const retry = getNotificationRetryState(attempts, errorCode)
    return { status: retry.status, attempts, lastError: retry.lastError }
  }
}
