/**
 * Couple Management - Phase 4
 * Functions for creating, managing, and linking couples
 */

import { supabase } from './supabase'

export type CoupleStatus = 'none' | 'pending' | 'accepted' | 'declined'

export interface Couple {
  id: string
  name: string | null
  anniversary: string | null
  created_at: string
  updated_at: string
}

export interface CoupleLink {
  id: string
  inviter_id: string
  accepted_by: string | null
  invite_code: string
  status: 'pending' | 'accepted' | 'declined' | 'revoked'
  couple_id: string | null
  created_at: string
  accepted_at: string | null
}

export interface CoupleStatusResult {
  status: CoupleStatus
  couple: Couple | null
  invite: CoupleLink | null
  partner: PartnerProfile | null
}

export interface PartnerProfile {
  id: string
  email: string | null
  full_name: string | null
}

/**
 * Get current couple status
 */
export async function getCoupleStatus(): Promise<CoupleStatusResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { status: 'none', couple: null, invite: null, partner: null }
  }

  // Check if user has an accepted couple link
  const { data: acceptedLink } = await supabase
    .from('couple_links')
    .select('*, couples(*)')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .single()

  if (acceptedLink) {
    // Get partner info
    const partnerId = acceptedLink.inviter_id === user.id ? acceptedLink.accepted_by : acceptedLink.inviter_id
    const { data: partner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()

    return {
      status: 'accepted',
      couple: acceptedLink.couples as Couple,
      invite: acceptedLink as CoupleLink,
      partner: partner as PartnerProfile | null,
    }
  }

  // Check for pending invites (user was invited)
  const { data: pendingInvite } = await supabase
    .from('couple_links')
    .select('*')
    .eq('accepted_by', user.id)
    .eq('status', 'pending')
    .single()

  if (pendingInvite) {
    const { data: inviter } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', pendingInvite.inviter_id)
      .single()

    return {
      status: 'pending',
      couple: null,
      invite: pendingInvite as CoupleLink,
      partner: inviter as PartnerProfile | null,
    }
  }

  // Check for invites user sent
  const { data: sentInvite } = await supabase
    .from('couple_links')
    .select('*')
    .eq('inviter_id', user.id)
    .eq('status', 'pending')
    .single()

  if (sentInvite) {
    return {
      status: 'pending',
      couple: null,
      invite: sentInvite as CoupleLink,
      partner: null,
    }
  }

  return { status: 'none', couple: null, invite: null, partner: null }
}

/**
 * Create a couple and send invite
 */
export async function createCoupleAndInvite(partnerEmail: string, coupleName?: string) {
  void coupleName
  const { data: inviteCode, error } = await supabase.rpc('create_couple_invite', {
    partner_email: partnerEmail,
  })

  if (error || !inviteCode) {
    throw new Error(error?.message || 'Failed to send invite')
  }

  return inviteCode
}

/**
 * Accept a couple invite
 */
export async function acceptCoupleInvite(linkId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: invite, error: inviteError } = await supabase
    .from('couple_links')
    .select('invite_code')
    .eq('id', linkId)
    .eq('accepted_by', user.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    throw new Error(inviteError?.message || 'Failed to accept invite')
  }

  const { data: coupleId, error } = await supabase.rpc('accept_couple_invite', {
    p_invite_code: invite.invite_code,
  })

  if (error || !coupleId) {
    throw new Error(error?.message || 'Failed to accept invite')
  }

  return coupleId
}

/**
 * Decline a couple invite
 */
export async function declineCoupleInvite(linkId: string) {
  const { error } = await supabase.rpc('decline_couple_invite', {
    p_link_id: linkId,
  })

  if (error) {
    throw new Error(error.message || 'Failed to decline invite')
  }
}

/**
 * Leave current couple
 */
export async function leaveCouple() {
  const { error } = await supabase.rpc('leave_couple')

  if (error) {
    throw new Error(error.message || 'Failed to leave couple')
  }

  return { success: true }
}

/**
 * Update couple details
 */
export async function updateCouple(coupleId: string, updates: { name?: string; anniversary?: string }) {
  const { data, error } = await supabase
    .from('couples')
    .update(updates)
    .eq('id', coupleId)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update couple')
  }

  return data
}

/**
 * Get couple by invite code
 */
export async function getCoupleByInviteCode(code: string) {
  const { data, error } = await supabase
    .from('couple_links')
    .select('*, couples(*), profiles!couple_links_inviter_id_fkey(*)')
    .eq('invite_code', code)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    throw new Error('Invalid or expired invite code')
  }

  return data
}
