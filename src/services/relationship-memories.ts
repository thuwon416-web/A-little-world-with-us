import { supabase } from '@/lib/supabase'
import type { RelationshipMemory } from '@/shared-types'

export interface RelationshipMemoryQueryOptions {
  limit?: number
  offset?: number
}

const CATEGORY_ALIASES: Record<string, string> = {
  promise: 'promises',
  commitment: 'promises',
  vow: 'promises',
}

function normalizeCategory(category: string) {
  const normalized = category.toLowerCase().trim()
  return CATEGORY_ALIASES[normalized] ?? normalized
}

export const relationshipMemoriesService = {
  async getByCouple(
    coupleId: string,
    options: RelationshipMemoryQueryOptions = {}
  ): Promise<RelationshipMemory[]> {
    const limit = options.limit ?? 50
    const offset = options.offset ?? 0
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('id, couple_id, category, sub_category, date_time, quote_burmese, context, persons, emotional_tone, importance, batch_id, created_at')
      .eq('couple_id', coupleId)
      .order('date_time', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async getHighlights(coupleId: string, limit = 50): Promise<RelationshipMemory[]> {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('id, couple_id, category, sub_category, date_time, quote_burmese, context, persons, emotional_tone, importance, batch_id, created_at')
      .eq('couple_id', coupleId)
      .in('importance', ['critical', 'high'])
      .order('date_time', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async getByCategory(
    coupleId: string,
    category: string,
    limit = 50,
    offset = 0
  ): Promise<RelationshipMemory[]> {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('id, couple_id, category, sub_category, date_time, quote_burmese, context, persons, emotional_tone, importance, batch_id, created_at')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .order('date_time', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async search(
    coupleId: string,
    keyword: string,
    limit = 50,
    offset = 0
  ): Promise<RelationshipMemory[]> {
    const safeKeyword = keyword.replace(/[%(),]/g, ' ').trim()
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('id, couple_id, category, sub_category, date_time, quote_burmese, context, persons, emotional_tone, importance, batch_id, created_at')
      .eq('couple_id', coupleId)
      .or(`quote_burmese.ilike.%${safeKeyword}%,context.ilike.%${safeKeyword}%`)
      .order('date_time', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async getOnThisDay(coupleId: string, date: Date): Promise<RelationshipMemory[]> {
    const { data, error } = await supabase
      .rpc('on_this_day_memories', {
        p_couple_id: coupleId,
        p_month: date.getMonth() + 1,
        p_day: date.getDate(),
      })
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async getStats(coupleId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .rpc('memory_category_stats', {
        p_couple_id: coupleId,
      })
    if (error) throw error
    return (data ?? []).reduce((stats: Record<string, number>, row: { category: string; count: number }) => {
      const category = normalizeCategory(row.category)
      stats[category] = (stats[category] ?? 0) + (row.count ?? 0)
      return stats
    }, {} as Record<string, number>)
  },
}
