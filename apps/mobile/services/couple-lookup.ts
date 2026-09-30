import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

export type AcceptedCoupleLink = {
  id: string
  couple_id: string | null
  inviter_id: string | null
  accepted_by: string | null
  status: string | null
  invite_code: string | null
}

export async function getAcceptedCoupleLink(
  client: SupabaseClient,
  userId: string
): Promise<{ data: AcceptedCoupleLink | null; error: PostgrestError | null }> {
  const { data, error } = await client
    .from('couple_links')
    .select('id,couple_id,inviter_id,accepted_by,status,invite_code')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .eq('status', 'accepted')
    .maybeSingle()

  return { data, error }
}

export async function getAcceptedCoupleId(
  client: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await getAcceptedCoupleLink(client, userId)
  return data?.couple_id ?? null
}
