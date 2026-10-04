import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createAdminClient, writeAdminAudit } from '@/lib/admin'

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
  const { error } = await admin.from('account_deletion_requests').upsert({
    user_id: user.id,
    scheduled_for: scheduledFor,
    requested_at: new Date().toISOString(),
    cancelled_at: null,
    completed_at: null,
  })
  if (error) return NextResponse.json({ error: 'Unable to request account deletion.' }, { status: 500 })

  await admin.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)
  await writeAdminAudit(admin, user.id, 'request_account_deletion', 'profile', user.id, { graceDays, scheduledFor })

  return NextResponse.json({ status: 'scheduled', scheduledFor })
}
