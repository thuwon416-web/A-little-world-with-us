import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmergencyContactEmail } from './emailNotifier.ts'
import { expoTicketsDelivered, getNotificationRetryState } from './notification-state.ts'

type SafetyCheckin = {
  id: string
  couple_id: string
  user_id: string
  checkin_type: 'safe' | 'need_help' | 'home'
  status: 'pending' | 'expired'
  message: string | null
  expected_until: string | null
  notification_attempts: number
}
type CoupleLink = { inviter_id: string; accepted_by: string }
type PushDevice = { expo_push_token: string; preferences: Record<string, boolean> | null }
type EmergencyContact = {
  id: string
  email: string | null
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !serviceRole) {
  throw new Error('Missing Supabase Edge Function environment.')
}

const supabase = createClient(supabaseUrl, serviceRole)


async function setNotificationStatus(checkinId: string, status: 'pending' | 'processing' | 'delivered' | 'failed', attempts: number, error: string | null) {
  const { error: checkinError } = await supabase.from('safety_checkins').update({
    notification_status: status,
    notification_attempts: attempts,
    last_notification_error: error,
  }).eq('id', checkinId)
  if (checkinError) throw checkinError
  const { error: outboxError } = await supabase.from('safety_notification_outbox').update({
    status,
    attempts,
    last_error: error,
    updated_at: new Date().toISOString(),
    ...(status === 'pending' ? { next_attempt_at: new Date(Date.now() + 5 * 60_000).toISOString() } : {}),
  }).eq('checkin_id', checkinId)
  if (outboxError) throw outboxError
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const candidate = request.headers.get('x-job-secret') ?? ''
  const { data: authorized, error: authError } = await supabase.rpc('verify_backend_cron_secret', {
    p_secret_name: 'check_missed_checkin_secret',
    p_candidate: candidate,
  })
  if (authError || authorized !== true) return new Response('Unauthorized', { status: 401 })

  try {
    // Recover abandoned processing leases after a worker crash so the durable
    // outbox can be retried by the next scheduled invocation.
    const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString()
    const { error: staleCheckinError } = await supabase
      .from('safety_checkins')
      .update({ notification_status: 'pending' })
      .eq('notification_status', 'processing')
      .lt('updated_at', staleBefore)
    if (staleCheckinError) return Response.json({ error: staleCheckinError.message }, { status: 500 })
    const { error: staleOutboxError } = await supabase
      .from('safety_notification_outbox')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('status', 'processing')
      .lt('updated_at', staleBefore)
    if (staleOutboxError) return Response.json({ error: staleOutboxError.message }, { status: 500 })

    const { data: dueOutbox, error: dueOutboxError } = await supabase
      .from('safety_notification_outbox')
      .select('checkin_id')
      .eq('status', 'pending')
      .lte('next_attempt_at', new Date().toISOString())
    if (dueOutboxError) return Response.json({ error: dueOutboxError.message }, { status: 500 })
    const dueOutboxIds = new Set((dueOutbox ?? []).map((row: { checkin_id: string }) => row.checkin_id))

    const { data: checkins, error: checkinsError } = await supabase
      .from('safety_checkins')
      .select('id,couple_id,user_id,checkin_type,status,message,expected_until,notification_attempts')
      .in('status', ['pending', 'expired'])
      .eq('notification_status', 'pending')
      .not('expected_until', 'is', null)
      .lt('expected_until', new Date().toISOString())
    if (checkinsError) return Response.json({ error: checkinsError.message }, { status: 500 })

    const { data: links, error: linksError } = await supabase
      .from('couple_links')
      .select('inviter_id,accepted_by')
      .eq('status', 'accepted')
    if (linksError) return Response.json({ error: linksError.message }, { status: 500 })

    let processed = 0
    let notified = 0
    let contactsConsidered = 0

    for (const checkin of (checkins ?? []) as SafetyCheckin[]) {
      if (checkin.status === 'expired' && !dueOutboxIds.has(checkin.id)) continue
      const { data: expiredCheckin, error: updateError } = await supabase
        .from('safety_checkins')
        .update({ status: 'expired', notification_status: 'processing', notification_attempts: checkin.notification_attempts + 1, last_notification_error: null, updated_at: new Date().toISOString() })
        .eq('id', checkin.id)
        .eq('notification_status', 'pending')
        .in('status', ['pending', 'expired'])
        .select('id,notification_attempts')
        .maybeSingle()
      if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
      if (!expiredCheckin) continue
      processed += 1

      const link = (links ?? []).find((candidate: CoupleLink) =>
        candidate.inviter_id === checkin.user_id || candidate.accepted_by === checkin.user_id)
      const partnerId = link
        ? (link.inviter_id === checkin.user_id ? link.accepted_by : link.inviter_id)
        : null
      const attempts = expiredCheckin.notification_attempts ?? checkin.notification_attempts + 1
      const { error: claimOutboxError } = await supabase
        .from('safety_notification_outbox')
        .update({ status: 'processing', attempts, updated_at: new Date().toISOString() })
        .eq('checkin_id', checkin.id)
        .eq('status', 'pending')
      if (claimOutboxError) return Response.json({ error: claimOutboxError.message }, { status: 500 })
      if (!partnerId) {
        const retry = getNotificationRetryState(attempts, 'No accepted partner is available for this safety alert.')
        await setNotificationStatus(checkin.id, retry.status, attempts, retry.lastError)
        if (retry.status === 'failed') console.error('[check-missed-checkin] Safety notification permanently failed', { checkin_id: checkin.id })
        continue
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name,email')
        .eq('id', checkin.user_id)
        .maybeSingle()
      const userName = profile?.full_name || profile?.email || 'Partner'

      const { data: devices, error: devicesError } = await supabase
        .from('push_devices')
        .select('expo_push_token,preferences')
        .eq('user_id', partnerId)
      if (devicesError) return Response.json({ error: devicesError.message }, { status: 500 })
      const messages = ((devices ?? []) as PushDevice[])
        .filter((device) => device.preferences?.missed_checkin !== false)
        .map((device) => ({
          to: device.expo_push_token,
          sound: 'default',
          title: 'Missed check-in ⚠️',
          body: `${userName}'s ${checkin.checkin_type} check-in has expired. Please check on them.`,
          data: { type: 'missed_checkin', checkinId: checkin.id, userId: checkin.user_id },
        }))

      if (!messages.length) {
        const retry = getNotificationRetryState(attempts, 'No eligible partner push devices are registered.')
        await setNotificationStatus(checkin.id, retry.status, attempts, retry.lastError)
        if (retry.status === 'failed') console.error('[check-missed-checkin] Safety notification permanently failed', { checkin_id: checkin.id })
        continue
      }

      let delivered = false
      let deliveryError = 'Expo did not confirm delivery for every notification.'
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        })
        if (response.ok) {
          const payload = await response.json()
          delivered = expoTicketsDelivered(payload, messages.length)
        } else {
          deliveryError = 'Expo Push API returned HTTP ' + response.status
        }
      } catch {
        deliveryError = 'Expo Push API request failed.'
      }

      if (delivered) {
        await setNotificationStatus(checkin.id, 'delivered', attempts, null)
        notified += messages.length
      } else {
        const retry = getNotificationRetryState(attempts, deliveryError)
        await setNotificationStatus(checkin.id, retry.status, attempts, retry.lastError)
        if (retry.status === 'failed') console.error('[check-missed-checkin] Safety notification permanently failed', { checkin_id: checkin.id })
      }

      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('id,email')
        .eq('couple_id', checkin.couple_id)
        .eq('is_active', true)
        .eq('notify_on_checkin_missed', true)
      if (contactsError) return Response.json({ error: contactsError.message }, { status: 500 })
      contactsConsidered += (contacts ?? []).length
      for (const contact of (contacts ?? []) as EmergencyContact[]) {
        if (contact.email) {
          try {
            await sendEmergencyContactEmail({ to: contact.email, contactId: contact.id, checkinId: checkin.id })
          } catch (error) {
            console.warn('[check-missed-checkin] Emergency email unavailable', {
              contact_id: contact.id,
              error_code: error instanceof Error ? error.name : 'unknown_error',
            })
          }
        }
      }
    }

    return Response.json({ processed, notified, contactsConsidered })
  } catch (err) {
    console.error('[check-missed-checkin] Unhandled error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
})
