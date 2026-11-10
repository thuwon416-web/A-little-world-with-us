import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { getLocationAlertRecipient } from './recipient.ts'

Deno.test('inviter alert is sent to accepted partner', () => {
  assertEquals(getLocationAlertRecipient({ inviter_id: 'inviter', accepted_by: 'partner' }, 'inviter'), 'partner')
})

Deno.test('accepted partner alert is sent to inviter', () => {
  assertEquals(getLocationAlertRecipient({ inviter_id: 'inviter', accepted_by: 'partner' }, 'partner'), 'inviter')
})

Deno.test('non-member cannot resolve a recipient', () => {
  assertEquals(getLocationAlertRecipient({ inviter_id: 'inviter', accepted_by: 'partner' }, 'stranger'), null)
})
