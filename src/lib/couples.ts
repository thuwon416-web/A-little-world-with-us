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
  partner: any | null
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
      partner,
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
      partner: inviter,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Find partner by email
  const { data: partnerProfile, error: partnerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', partnerEmail)
    .single()

  if (partnerError || !partnerProfile) {
    throw new Error('Partner not found. Please ask them to sign up first.')
  }

  if (partnerProfile.id === user.id) {
    throw new Error('You cannot invite yourself')
  }

  // Check if already linked
  const { data: existingLink } = await supabase
    .from('couple_links')
    .select('*')
    .or(`and(inviter_id.eq.${user.id},accepted_by.eq.${partnerProfile.id}),and(inviter_id.eq.${partnerProfile.id},accepted_by.eq.${user.id})`)
    .single()

  if (existingLink) {
    throw new Error('Already linked with this user')
  }

  // Create couple
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({ name: coupleName || null })
    .select()
    .single()

  if (coupleError || !couple) {
    throw new Error('Failed to create couple')
  }

  // Create invite link
  const inviteCode = generateInviteCode()
  const { error: linkError } = await supabase
    .from('couple_links')
    .insert({
      inviter_id: user.id,
      accepted_by: partnerProfile.id,
      invite_code: inviteCode,
      couple_id: couple.id,
      status: 'pending',
    })

  if (linkError) {
    throw new Error('Failed to send invite')
  }

  return { couple, inviteCode }
}

/**
 * Accept a couple invite
 */
export async function acceptCoupleInvite(linkId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: link, error } = await supabase
    .from('couple_links')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', linkId)
    .eq('accepted_by', user.id)
    .select()
    .single()

  if (error || !link) {
    throw new Error('Failed to accept invite')
  }

  return link
}

/**
 * Decline a couple invite
 */
export async function declineCoupleInvite(linkId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('couple_links')
    .update({ status: 'declined' })
    .eq('id', linkId)
    .eq('accepted_by', user.id)

  if (error) {
    throw new Error('Failed to decline invite')
  }
}

/**
 * Leave current couple
 */
export async function leaveCouple() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get current couple link
  const { data: link } = await supabase
    .from('couple_links')
    .select('*')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .single()

  if (!link) {
    throw new Error('No active couple found')
  }

  // Remove couple_id from user's profile
  await supabase
    .from('profiles')
    .update({ couple_id: null })
    .eq('id', user.id)

  // Delete the couple link
  await supabase
    .from('couple_links')
    .delete()
    .eq('id', link.id)

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
 * Generate a random invite code
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
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
    .single()

  if (error) {
    throw new Error('Invalid or expired invite code')
  }

  return data
}
