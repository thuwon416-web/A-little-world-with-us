import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { PushSubscription, WebPushError } from 'web-push'
import { configureWebPush } from '@/lib/web-push-server'

export const runtime = 'nodejs'
export const maxDuration = 60

type DueReminder = {
  id: string
  couple_id: string
  title: string
  message: string | null
  scheduled_at: string
}

function isPushSubscription(value: unknown): value is PushSubscription {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PushSubscription>
  return Boolean(
    typeof candidate.endpoint === 'string' &&
      candidate.keys &&
      typeof candidate.keys.p256dh === 'string' &&
      typeof candidate.keys.auth === 'string'
  )
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured.' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Database service is not configured.' }, { status: 503 })
  }

  let pushClient: ReturnType<typeof configureWebPush>
  try {
    pushClient = configureWebPush()
  } catch {
    return NextResponse.json({ error: 'Browser push is not configured.' }, { status: 503 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const now = new Date().toISOString()
  const { data: reminders, error: reminderError } = await admin
    .from('reminders')
    .select('id,couple_id,title,message,scheduled_at')
    .eq('active', true)
    .is('web_notified_at', null)
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (reminderError) {
    console.error('Unable to load due reminders:', reminderError)
    return NextResponse.json({ error: 'Unable to load due reminders.' }, { status: 500 })
  }

  let processed = 0
  let sent = 0
  for (const reminder of (reminders ?? []) as DueReminder[]) {
    let shouldMarkProcessed = true
    const { data: link, error: linkError } = await admin
      .from('couple_links')
      .select('inviter_id,accepted_by')
      .eq('couple_id', reminder.couple_id)
      .eq('status', 'accepted')
      .maybeSingle()

    if (linkError) {
      console.error('Unable to read reminder couple link:', linkError)
      shouldMarkProcessed = false
    } else if (link?.inviter_id && link.accepted_by) {
      const memberIds = [link.inviter_id, link.accepted_by]
      const { data: subscriptions, error: subscriptionError } = await admin
        .from('web_push_subscriptions')
        .select('id,subscription')
        .in('user_id', memberIds)

      if (subscriptionError) {
        console.error('Unable to read browser push subscriptions:', subscriptionError)
        shouldMarkProcessed = false
      } else {
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.message ?? '',
          url: '/reminders',
          tag: `reminder-${reminder.id}`,
        })
        for (const row of subscriptions ?? []) {
          if (!isPushSubscription(row.subscription)) continue
          try {
            await pushClient.webPush.sendNotification(row.subscription, payload)
            sent += 1
          } catch (error) {
            const pushError = error as WebPushError
            if (pushError.statusCode === 404 || pushError.statusCode === 410) {
              await admin.from('web_push_subscriptions').delete().eq('id', row.id)
            } else {
              console.error('Browser push send failed:', pushError)
            }
          }
        }
      }
    }

    // Mark the one-time reminder after one dispatch pass so retries cannot duplicate alerts.
    if (!shouldMarkProcessed) continue
    const { error: markError } = await admin
      .from('reminders')
      .update({ web_notified_at: now })
      .eq('id', reminder.id)
      .is('web_notified_at', null)
    if (!markError) processed += 1
    else console.error('Unable to mark reminder as dispatched:', markError)
  }

  return NextResponse.json({ processed, sent })
}
