import { supabase } from '@/lib/supabase'
import type { RelationshipMemory } from '@/shared-types'

export interface RelationshipMemoryQueryOptions {
  limit?: number
  offset?: number
}

async function fetchAllBatched<T>(
  table: string,
  coupleId: string,
  columns = '*',
  orderColumn = 'date_time'
): Promise<T[]> {
  const batch = 1000
  const all: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq('couple_id', coupleId)
      .order(orderColumn, { ascending: false })
      .range(from, from + batch - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < batch) break
    from += batch
  }

  return all
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
  async getByCategory(coupleId: string, category: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('category', category)
      .order('date_time', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async search(coupleId: string, keyword: string, limit = 50, offset = 0) {
    const safeKeyword = keyword.replace(/[%(),]/g, ' ').trim()
    const { data, error } = await supabase
      .from('relationship_memories')
      .select('*')
      .eq('couple_id', coupleId)
      .or(`quote_burmese.ilike.%${safeKeyword}%,context.ilike.%${safeKeyword}%`)
      .order('date_time', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw error
    return (data ?? []) as RelationshipMemory[]
  },

  async getOnThisDay(coupleId: string, date: Date) {
    const memories = await fetchAllBatched<RelationshipMemory>('relationship_memories', coupleId)
    return memories.filter((memory) => {
      const memoryDate = new Date(memory.date_time)
      return memoryDate.getMonth() === date.getMonth() && memoryDate.getDate() === date.getDate()
    })
  },

  async getStats(coupleId: string) {
    const rows = await fetchAllBatched<{ category: string }>(
      'relationship_memories',
      coupleId,
      'category'
    )
    return rows.reduce<Record<string, number>>((stats, row) => {
      const category = normalizeCategory(row.category)
      stats[category] = (stats[category] ?? 0) + 1
      return stats
    }, {})
  },
}
