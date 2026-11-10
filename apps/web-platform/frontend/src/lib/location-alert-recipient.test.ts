import { describe, expect, it } from 'vitest'
import { getLocationAlertRecipient } from '../../../backend/supabase/functions/location-alerts/recipient'

describe('location alert recipient', () => {
  const link = { inviter_id: 'inviter', accepted_by: 'partner' }
  it('notifies the partner when inviter sends alert', () => expect(getLocationAlertRecipient(link, 'inviter')).toBe('partner'))
  it('notifies inviter when partner sends alert', () => expect(getLocationAlertRecipient(link, 'partner')).toBe('inviter'))
  it('rejects a non-member', () => expect(getLocationAlertRecipient(link, 'stranger')).toBeNull())
})
