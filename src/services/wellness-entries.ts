import { getCurrentUserId, supabase } from '@/lib/supabase'

export type WellnessEntry = {
  id: string
  couple_id: string
  author_id: string
  board_id: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export async function getEntries(coupleId: string, boardId: string): Promise<WellnessEntry[]> {
  const { data, error } = await supabase
    .from('wellness_entries')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WellnessEntry[]
}

export async function addEntry(
  coupleId: string,
  boardId: string,
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<WellnessEntry> {
  const authorId = await getCurrentUserId()
  if (!authorId) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('wellness_entries')
    .insert({ couple_id: coupleId, author_id: authorId, board_id: boardId, content, metadata })
    .select('*')
    .single()
  if (error) throw error
  return data as WellnessEntry
}

export async function updateEntry(entryId: string, content: string): Promise<void> {
  const { error } = await supabase
    .from('wellness_entries')
    .update({ content })
    .eq('id', entryId)
  if (error) throw error
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase
    .from('wellness_entries')
    .delete()
    .eq('id', entryId)
  if (error) throw error
}
