import { supabase } from '@/lib/supabase'

export type MemoryRecord = {
  id: string
  title: string
  caption: string | null
  date: string | null
  category: 'favorite' | 'travel' | 'ritual' | 'journal' | string
  image_url: string | null
  created_at: string
}

async function coupleId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase.from('couple_links').select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
  if (error || !data?.couple_id) throw new Error('No accepted couple is linked to this account.')
  return data.couple_id
}

export async function getMemories() {
  const id = await coupleId()
  const { data, error } = await supabase.from('memories').select('id,title,caption,date,category,image_url,created_at').eq('couple_id', id).order('date', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as MemoryRecord[]
}

export async function deleteMemory(id: string) {
  const { error } = await supabase.from('memories').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
