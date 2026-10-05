import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/admin'
import { isSameOriginRequest } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('cancel_account_deletion', {
    p_user_id: user.id,
  })
  if (error) return NextResponse.json({ error: 'Unable to cancel deletion.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'No active account deletion request.' }, { status: 409 })

  return NextResponse.json({ status: 'cancelled' })
}
