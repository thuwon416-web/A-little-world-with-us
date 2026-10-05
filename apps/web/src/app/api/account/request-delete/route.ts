import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/admin'
import { isSameOriginRequest } from '@/lib/csrf'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('account_deletion_requests')
    .select('scheduled_for,cancelled_at,completed_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Unable to load account deletion status.' }, { status: 500 })

  if (!data || data.completed_at || data.cancelled_at) {
    return NextResponse.json({ status: data?.cancelled_at ? 'cancelled' : undefined })
  }

  return NextResponse.json({ status: 'scheduled', scheduledFor: data.scheduled_for })
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Cross-origin request blocked.' }, { status: 403 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let graceDays = 30
  try {
    const body = await request.json()
    if (typeof body.graceDays === 'number') graceDays = Math.min(30, Math.max(7, Math.floor(body.graceDays)))
  } catch {}

  const admin = createAdminClient()
  const scheduledFor = new Date(Date.now() + graceDays * 86_400_000).toISOString()
  const { data, error } = await admin.rpc('request_account_deletion', {
    p_user_id: user.id,
    p_scheduled_for: scheduledFor,
  })
  if (error) return NextResponse.json({ error: 'Unable to request account deletion.' }, { status: 500 })

  return NextResponse.json({ status: 'scheduled', scheduledFor: data })
}
