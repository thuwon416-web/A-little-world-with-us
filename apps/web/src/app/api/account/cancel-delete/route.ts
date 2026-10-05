import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createAdminClient, writeAdminAudit } from '@/lib/admin'
import { isSameOriginRequest } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { error } = await admin.from('account_deletion_requests').update({
    cancelled_at: new Date().toISOString(),
    completed_at: null,
  }).eq('user_id', user.id).is('completed_at', null)
  if (error) return NextResponse.json({ error: 'Unable to cancel deletion.' }, { status: 500 })

  await admin.from('profiles').update({ deleted_at: null }).eq('id', user.id)
  await writeAdminAudit(admin, user.id, 'cancel_account_deletion', 'profile', user.id)
  return NextResponse.json({ status: 'cancelled' })
}
