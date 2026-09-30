import { supabase } from '@/lib/supabase'

export async function saveAISuggestion(content: string, category: 'gift' | 'date' | 'message') {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  const { data: link } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()
  const { error } = await supabase.from('favorites').insert({
    user_id: user.id,
    couple_id: link?.couple_id ?? null,
    category: 'gift_ideas',
    item_name: content.slice(0, 120),
    item_value: category,
    notes: content,
  })
  if (error) throw error
}
