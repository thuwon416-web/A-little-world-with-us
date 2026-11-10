import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { expoTicketsDelivered, getNotificationRetryState } from './notification-state.ts'

Deno.test('retries failed push until maximum attempts', () => {
  assertEquals(getNotificationRetryState(2, 'temporary'), { status: 'pending', lastError: 'temporary' })
  assertEquals(getNotificationRetryState(5, 'permanent'), { status: 'failed', lastError: 'permanent' })
})

Deno.test('requires every Expo ticket to report ok', () => {
  assertEquals(expoTicketsDelivered({ data: [{ status: 'ok' }, { status: 'ok' }] }, 2), true)
  assertEquals(expoTicketsDelivered({ data: [{ status: 'ok' }, { status: 'error' }] }, 2), false)
  assertEquals(expoTicketsDelivered({ data: [{ status: 'ok' }] }, 2), false)
})
