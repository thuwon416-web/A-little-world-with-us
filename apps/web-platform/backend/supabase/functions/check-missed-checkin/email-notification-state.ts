import type { EmailNotifier, EmergencyEmailInput } from '../_shared/emailNotifier.ts'
import { getNotificationRetryState } from './notification-state.ts'

export type EmergencyEmailDeliveryState = {
  status: 'pending' | 'delivered' | 'failed'
  attempts: number
  lastError: string | null
}

export async function deliverEmergencyEmail(
  notifier: EmailNotifier,
  input: EmergencyEmailInput,
  attempts: number,
): Promise<EmergencyEmailDeliveryState> {
  try {
    await notifier.sendEmergencyEmail(input)
    return { status: 'delivered', attempts, lastError: null }
  } catch (error) {
    const errorCode = error instanceof Error ? error.name : 'unknown_error'
    const retry = getNotificationRetryState(attempts, errorCode)
    return { status: retry.status, attempts, lastError: retry.lastError }
  }
}

export async function deliverAndPersistEmergencyEmail(
  notifier: EmailNotifier,
  input: EmergencyEmailInput,
  attempts: number,
  persist: (state: EmergencyEmailDeliveryState) => Promise<void>,
): Promise<EmergencyEmailDeliveryState> {
  const delivery = await deliverEmergencyEmail(notifier, input, attempts)
  await persist(delivery)
  return delivery
}
