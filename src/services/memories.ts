import { supabase } from '@/lib/supabase'
import type { Memory } from '@/shared-types'

export const memoriesService = {
  async getByCouple(coupleId: string): Promise<Memory[]> {
    const { data, error } = await supabase.from('memories').select('*').eq('couple_id', coupleId).order('date', { ascending: false })
    if (error) throw error
    return (data ?? []) as Memory[]
  },
  async create(memory: Omit<Memory, 'id' | 'created_at' | 'updated_at'>): Promise<Memory> {
    const { data, error } = await supabase.from('memories').insert(memory).select().single()
    if (error) throw error
    return data as Memory
  },
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  },
}
