import { supabase } from '@/lib/supabase'
import type { VaultItem } from '@/shared-types'

export async function getContext() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  const { data, error } = await supabase
    .from('couple_links')
    .select('id,couple_id,inviter_id,accepted_by,status,invite_code')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return { user, link: data, coupleId: data?.status === 'accepted' ? data.couple_id : null }
}

export async function getVaultItems(coupleId: string): Promise<VaultItem[]> {
  const context = await getContext()
  if (!context.coupleId || context.coupleId !== coupleId) {
    throw new Error('You can only view vault items for your accepted couple.')
  }
  const { data, error } = await supabase
    .from('vault_items')
    .select('id,couple_id,user_id,title,content,photo_url,created_at,updated_at')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as VaultItem[]
}
export async function addVaultItem(
  coupleId: string,
  userId: string,
  title: string,
  content: string,
  photoUrl?: string
) {
  const context = await getContext()
  if (!context.coupleId || context.coupleId !== coupleId || context.user.id !== userId) {
    throw new Error('You can only add vault items for your accepted couple.')
  }
  const { error } = await supabase
    .from('vault_items')
    .insert({ couple_id: coupleId, user_id: userId, title, content, photo_url: photoUrl || null })
  if (error) throw new Error(error.message)
}
export async function deleteVaultItem(id: string) {
  const { coupleId } = await getContext()
  if (!coupleId) throw new Error('Accept a partner link before managing vault items.')
  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw new Error(error.message)
}

export async function getCapsules(coupleId: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('couple_id', coupleId)
    .order('unlock_at')
  if (error) throw new Error(error.message)
  return data ?? []
}
export async function addCapsule(
  coupleId: string,
  userId: string,
  recipientId: string,
  title: string,
  content: string,
  unlockAt: string
) {
  const { error } = await supabase.from('time_capsules').insert({
    couple_id: coupleId,
    user_id: userId,
    recipient_id: recipientId,
    title,
    content,
    unlock_at: unlockAt,
  })
  if (error) throw new Error(error.message)
}
export async function deleteCapsule(id: string) {
  const { error } = await supabase.from('time_capsules').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getCalls(coupleId: string) {
  const { data, error } = await supabase
    .from('call_logs')
    .select('*')
    .eq('couple_id', coupleId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function acceptLink(userId: string, code: string) {
  const { data: link, error } = await supabase
    .from('couple_links')
    .select('id,couple_id,inviter_id')
    .eq('invite_code', code)
    .eq('status', 'pending')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!link) throw new Error('No pending link was found for that code.')
  if (link.inviter_id === userId) throw new Error('You cannot accept your own link.')
  const { error: updateError } = await supabase
    .from('couple_links')
    .update({ accepted_by: userId, status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', link.id)
  if (updateError) throw new Error(updateError.message)
}
export async function unlinkCoupleLink(id: string) {
  const { error } = await supabase.from('couple_links').update({ status: 'revoked' }).eq('id', id)
  if (error) throw new Error(error.message)
}
export async function declineLink(id: string) {
  const { error } = await supabase.from('couple_links').update({ status: 'declined' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export function moonPhase(date = new Date()) {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const synodicMonth = 29.530588853
  const age = ((date.getTime() - knownNewMoon) / 86400000) % synodicMonth
  const phase = (age + synodicMonth) % synodicMonth
  if (phase < 1.85 || phase > 27.68) return 'New Moon'
  if (phase < 7.38) return 'Waxing Crescent'
  if (phase < 9.23) return 'First Quarter'
  if (phase < 14.77) return 'Waxing Gibbous'
  if (phase < 16.61) return 'Full Moon'
  if (phase < 22.15) return 'Waning Gibbous'
  if (phase < 23.99) return 'Last Quarter'
  return 'Waning Crescent'
}
