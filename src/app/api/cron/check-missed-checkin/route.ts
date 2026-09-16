import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!cronSecret || !supabaseUrl || !serviceRole) {
    return NextResponse.json({ error: 'Cron environment is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/check-missed-checkin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceRole}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  const payload = await response.json().catch(() => ({ error: 'Invalid Edge Function response' }))
  return NextResponse.json(payload, { status: response.ok ? 200 : 500 })
}
