import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export async function assertAdmin(serviceClient: SupabaseClient, accessToken: string) {
  const { data: { user }, error: userError } = await serviceClient.auth.getUser(accessToken)
  if (userError || !user) throw new Error('Unauthorized')

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile?.role !== 'admin') throw new Error('Forbidden')
  return user
}

export async function writeAdminAudit(
  serviceClient: SupabaseClient,
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown> = {}
) {
  await serviceClient.from('admin_audit_logs').insert({
    actor_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  })
}

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export const createServiceClient = createAdminClient
