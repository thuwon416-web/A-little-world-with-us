import { getCurrentUserId, supabase } from '@/lib/supabase'

export type CoupleLinkStatus = 'pending' | 'accepted' | 'declined' | 'revoked'

export async function getPairStatus(): Promise<{ status: CoupleLinkStatus } | null> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from('couple_links')
    .select('status')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return null
  }

  return data ? { status: data.status as CoupleLinkStatus } : null
}

export async function createPairInvite(code: string) {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('couple_links')
    .insert({
      inviter_id: userId,
      invite_code: code,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function acceptPairInvite(code: string) {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('couple_links')
    .update({
      status: 'accepted',
      accepted_by: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('invite_code', code)
    .eq('status', 'pending')
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
