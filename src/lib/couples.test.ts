import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authGetUser, rpc, from, queryMethods } = vi.hoisted(() => {
  const queryMethods = {
    select: vi.fn(),
    eq: vi.fn(),
    gt: vi.fn(),
    single: vi.fn(),
  }

  return {
    authGetUser: vi.fn(),
    rpc: vi.fn(),
    from: vi.fn(),
    queryMethods,
  }
})

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: authGetUser },
    rpc,
    from,
  },
}))

import {
  acceptCoupleInvite,
  createCoupleAndInvite,
  declineCoupleInvite,
  getCoupleByInviteCode,
  leaveCouple,
} from './couples'

const invite = {
  id: 'link-1',
  inviter_id: 'user-a',
  accepted_by: 'user-b',
  invite_code: '0123456789abcdef',
  couple_id: 'couple-1',
  status: 'pending',
  expires_at: '2099-01-01T00:00:00.000Z',
}

describe('couple invite RPC flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-b' } } })
    rpc.mockResolvedValue({ data: null, error: null })
    queryMethods.select.mockImplementation(() => queryMethods)
    queryMethods.eq.mockImplementation(() => queryMethods)
    queryMethods.gt.mockImplementation(() => queryMethods)
    queryMethods.single.mockImplementation(async () => ({
      data: invite,
      error: null,
    }))
    from.mockReturnValue(queryMethods)
  })

  it('creates, looks up, accepts, and leaves a couple invite', async () => {
    rpc.mockResolvedValueOnce({ data: invite.invite_code, error: null })

    await expect(createCoupleAndInvite('user-b@example.com')).resolves.toBe(invite.invite_code)
    expect(rpc).toHaveBeenNthCalledWith(1, 'create_couple_invite', {
      partner_email: 'user-b@example.com',
    })

    await expect(getCoupleByInviteCode(invite.invite_code)).resolves.toEqual(invite)
    expect(from).toHaveBeenCalledWith('couple_links')
    expect(queryMethods.eq).toHaveBeenCalledWith('invite_code', invite.invite_code)
    expect(queryMethods.gt).toHaveBeenCalledWith('expires_at', expect.any(String))

    rpc.mockResolvedValueOnce({ data: invite.couple_id, error: null })

    await expect(acceptCoupleInvite(invite.id)).resolves.toBe(invite.couple_id)
    expect(queryMethods.eq).toHaveBeenCalledWith('id', invite.id)
    expect(queryMethods.eq).toHaveBeenCalledWith('accepted_by', 'user-b')
    expect(rpc).toHaveBeenNthCalledWith(2, 'accept_couple_invite', {
      p_invite_code: invite.invite_code,
    })

    await expect(leaveCouple()).resolves.toEqual({ success: true })
    expect(rpc).toHaveBeenNthCalledWith(3, 'leave_couple')
  })

  it('declines an invite through the protected RPC', async () => {
    await expect(declineCoupleInvite(invite.id)).resolves.toBeUndefined()
    expect(rpc).toHaveBeenCalledWith('decline_couple_invite', {
      p_link_id: invite.id,
    })
  })
})
