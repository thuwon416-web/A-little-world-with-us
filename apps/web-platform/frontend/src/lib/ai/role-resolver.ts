import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type CoupleRole = 'him' | 'her'

export interface ResolvedCoupleRole {
  coupleId: string
  partnerId: string
  role: CoupleRole
}

type ProfileRow = { gender: string | null }
type CoupleLinkRow = {
  couple_id: string
  inviter_id: string
  accepted_by: string
}

function roleFromGender(gender: string | null | undefined): CoupleRole | null {
  const normalized = gender?.trim().toLowerCase()
  if (normalized === 'male' || normalized === 'man' || normalized === 'him') return 'him'
  if (normalized === 'female' || normalized === 'woman' || normalized === 'her') return 'her'
  return null
}

/**
 * Resolve the signed-in member's relationship persona from server-side data.
 * The resolver deliberately never trusts a role supplied by a client.
 */
export async function resolveCoupleRole(
  client: SupabaseClient,
  userId: string
): Promise<ResolvedCoupleRole | null> {
  const [{ data: profile, error: profileError }, { data: link, error: linkError }] =
    await Promise.all([
      client.from('profiles').select('gender').eq('id', userId).maybeSingle<ProfileRow>(),
      client
        .from('couple_links')
        .select('couple_id,inviter_id,accepted_by')
        .eq('status', 'accepted')
        .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
        .limit(1)
        .maybeSingle<CoupleLinkRow>(),
    ])

  if (profileError || linkError || !link?.accepted_by) return null

  const partnerId = link.inviter_id === userId ? link.accepted_by : link.inviter_id
  const role = roleFromGender(profile?.gender) ?? (link.inviter_id === userId ? 'him' : 'her')

  return { coupleId: link.couple_id, partnerId, role }
}
