import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server database credentials are not configured.')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function assertAdmin(userId: string, client = createAdminClient()) {
  const { data, error } = await client.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (error) throw error
  if (data?.role !== 'admin') {
    const error = new Error('Forbidden')
    ;(error as Error & { status?: number }).status = 403
    throw error
  }
  return true
}

export async function writeAdminAudit(
  client: SupabaseClient,
  actorId: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details: Record<string, unknown> = {}
) {
  const { error } = await client.from('admin_audit_logs').insert({
    actor_id: actorId,
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
    details,
  })
  if (error) throw error
}
