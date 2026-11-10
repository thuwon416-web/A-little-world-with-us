import { describe, expect, it } from 'vitest'
import { expoTicketsDelivered, getNotificationRetryState } from '../../../backend/supabase/functions/check-missed-checkin/notification-state'

describe('safety notification delivery state', () => {
  it('retries temporary failures and stops after five attempts', () => {
    expect(getNotificationRetryState(2, 'temporary')).toEqual({ status: 'pending', lastError: 'temporary' })
    expect(getNotificationRetryState(5, 'permanent')).toEqual({ status: 'failed', lastError: 'permanent' })
  })
  it('marks delivered only when every Expo ticket is OK', () => {
    expect(expoTicketsDelivered({ data: [{ status: 'ok' }, { status: 'ok' }] }, 2)).toBe(true)
    expect(expoTicketsDelivered({ data: [{ status: 'ok' }, { status: 'error' }] }, 2)).toBe(false)
    expect(expoTicketsDelivered({ data: [{ status: 'ok' }] }, 2)).toBe(false)
  })
})
