import { supabase } from '@/lib/supabase'
import type { VaultItem } from '@/shared-types'

export const vaultService = {
  async getByCouple(coupleId: string): Promise<VaultItem[]> {
    const { data, error } = await supabase.from('vault_items').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as VaultItem[]
  },
  async create(item: Omit<VaultItem, 'id' | 'created_at' | 'updated_at'>): Promise<VaultItem> {
    const { data, error } = await supabase.from('vault_items').insert(item).select().single()
    if (error) throw error
    return data as VaultItem
  },
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase.from('vault_items').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  },
}
