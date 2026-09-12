import { supabase } from '@/lib/supabase'
import type { Memory } from '@/shared-types'

export type MemoryRecord = Pick<
  Memory,
  'id' | 'title' | 'caption' | 'date' | 'category' | 'image_url' | 'created_at'
>

async function getCoupleId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error || !data?.couple_id) throw new Error('No accepted couple is linked to this account.')
  return data.couple_id
}

export async function getMemories(): Promise<MemoryRecord[]> {
  const id = await getCoupleId()
  const { data, error } = await supabase
    .from('memories')
    .select('id,title,caption,date,category,image_url,created_at')
    .eq('couple_id', id)
    .order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as MemoryRecord[]
}

export async function deleteMemory(id: string) {
  const activeCoupleId = await getCoupleId()
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('couple_id', activeCoupleId)
  if (error) throw new Error(error.message)
}
