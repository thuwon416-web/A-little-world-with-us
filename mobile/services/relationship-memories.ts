import { supabase } from '@/lib/supabase'
import type { RelationshipMemory } from '@/shared-types'

export interface RelationshipMemoryQueryOptions {
  limit?: number
  offset?: number
}

export const relationshipMemoriesService = {
  async getByCouple(coupleId: string, options: RelationshipMemoryQueryOptions = {}) {
    const limit = options.limit ?? 50
    const offset = options.offset ?? 0
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date_time', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },
  async getHighlights(coupleId: string, limit = 50) {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .in('importance', ['critical', 'high'])
      .order('date_time', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },
  async getByCategory(coupleId: string, category: string) {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .order('date_time', { ascending: false })
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },
  async search(coupleId: string, keyword: string) {
    const safeKeyword = keyword.replace(/[%(),]/g, ' ').trim()
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .or(`quote_burmese.ilike.%${safeKeyword}%,context.ilike.%${safeKeyword}%`)
      .order('date_time', { ascending: false })
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },
  async getOnThisDay(coupleId: string, date: Date) {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date_time', { ascending: false })
    if (error) throw error
    return (data ?? []).filter((memory) => {
      const memoryDate = new Date(memory.date_time)
      return memoryDate.getMonth() === date.getMonth() && memoryDate.getDate() === date.getDate()
    }) as RelationshipMemory[]
  },
  async getStats(coupleId: string) {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('category')
      .eq('couple_id', coupleId)
    if (error) throw error
    return (data ?? []).reduce<Record<string, number>>((stats, row) => {
      stats[row.category] = (stats[row.category] ?? 0) + 1
      return stats
    }, {})
  },
}
