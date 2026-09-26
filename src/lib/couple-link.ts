import { getCurrentUserId, supabase } from '@/lib/supabase'

export type CoupleLinkStatus = 'pending' | 'accepted' | 'declined' | 'revoked'

export async function getPairStatus(): Promise<{ status: CoupleLinkStatus; inviteCode: string | null } | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const { data, error } = await supabase
    .from('couple_links')
    .select('status,invite_code')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Unable to load couple link: ${error.message}`)
  }

  return data ? { status: data.status as CoupleLinkStatus, inviteCode: data.invite_code ?? null } : null
}

export async function createPairInvite() {
  const { data, error } = await supabase.rpc('create_couple_code_invite')
  if (error || !data) throw new Error(error?.message || 'Failed to create invite')
  return data as string
}

export async function acceptPairInvite(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{8}$/.test(normalized)) throw new Error('Invalid invite code')

  const { data, error } = await supabase.rpc('accept_couple_code_invite', {
    p_invite_code: normalized,
  })

  if (error || !data) throw new Error(error?.message || 'Failed to accept invite')
  return data as string
}
