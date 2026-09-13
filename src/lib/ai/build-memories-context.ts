import type { SupabaseClient } from '@supabase/supabase-js'

interface BuildMemoriesContextOptions {
  supabase: SupabaseClient
  userId: string
  limit?: number
}

interface MemoryRow {
  date_time: string
  quote_burmese: string | null
  category: string
  context: string | null
}

export async function buildMemoriesContext(
  coupleId: string,
  userQuery: string,
  options: BuildMemoriesContextOptions
): Promise<string> {
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 10)

  const { data: privacy, error: privacyError } = await options.supabase
    .from('ai_privacy_settings')
    .select('allow_ai_read_memories')
    .eq('user_id', options.userId)
    .maybeSingle()

  // The consent column is introduced separately from this integration. Until it
  // exists, or when it is disabled, memory context must remain unavailable.
  if (privacyError || privacy?.allow_ai_read_memories !== true) return ''

  const keyword = userQuery.trim()
  if (!keyword) return ''

  const escapedKeyword = keyword.replace(/[%_,]/g, (character) => `\\${character}`)
  const { data: memories, error: memoriesError } = await options.supabase
    .from('relationship_memories')
    .select('date_time,quote_burmese,category,context')
    .eq('couple_id', coupleId)
    .or(`quote_burmese.ilike.%${escapedKeyword}%,context.ilike.%${escapedKeyword}%`)
    .order('date_time', { ascending: false })
    .limit(limit)

  if (memoriesError || !memories?.length) return ''

  const formattedMemories = (memories as MemoryRow[]).map((memory) => {
    const date = new Date(memory.date_time).toISOString().slice(0, 10)
    const quote = memory.quote_burmese ? ` "${memory.quote_burmese}"` : ''
    return `- [${date}]${quote} (${memory.category})`
  })

  return `Relevant relationship memories:\n\n${formattedMemories.join('\n')}`
}
