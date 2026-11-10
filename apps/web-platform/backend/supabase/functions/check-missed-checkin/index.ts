import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createEmailNotifier } from '../_shared/emailNotifier.ts'
import { deliverEmergencyEmail } from './email-notification-state.ts'
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
type PendingEmergencyEmail = { id: string; checkin_id: string; contact_id: string; attempts: number }

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !serviceRole) {
  throw new Error('Missing Supabase Edge Function environment.')
}

const supabase = createClient(supabaseUrl, serviceRole)
const emailNotifier = createEmailNotifier((name) => Deno.env.get(name))


async function setNotificationStatus(checkinId: string, status: 'pending' | 'processing' | 'delivered' | 'failed', attempts: number, error: string | null) {
  const { error: stateError } = await supabase.rpc('set_safety_notification_state', {
    p_checkin_id: checkinId,
    p_status: status,
    p_attempts: attempts,
    p_error: error,
  })
  if (stateError) throw stateError
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
    const { error: staleEmailError } = await supabase
      .from('safety_email_outbox')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('status', 'processing')
      .lt('updated_at', staleBefore)
    if (staleEmailError) return Response.json({ error: staleEmailError.message }, { status: 500 })

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
      const { data: claimedAttempts, error: claimError } = await supabase.rpc('claim_safety_notification', {
        p_checkin_id: checkin.id,
      })
      if (claimError) return Response.json({ error: claimError.message }, { status: 500 })
      if (typeof claimedAttempts !== 'number') continue
      processed += 1

      const link = (links ?? []).find((candidate: CoupleLink) =>
        candidate.inviter_id === checkin.user_id || candidate.accepted_by === checkin.user_id)
      const partnerId = link
        ? (link.inviter_id === checkin.user_id ? link.accepted_by : link.inviter_id)
        : null
      const attempts = claimedAttempts
      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('couple_id', checkin.couple_id)
        .eq('is_active', true)
        .eq('notify_on_checkin_missed', true)
      if (contactsError) return Response.json({ error: contactsError.message }, { status: 500 })
      if (contacts?.length) {
        const { error: enqueueError } = await supabase.from('safety_email_outbox').upsert(
          contacts.map((contact: { id: string }) => ({ checkin_id: checkin.id, contact_id: contact.id })),
          { onConflict: 'checkin_id,contact_id', ignoreDuplicates: true },
        )
        if (enqueueError) return Response.json({ error: enqueueError.message }, { status: 500 })
      }
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

    }

    const { data: pendingEmails, error: pendingEmailError } = await supabase
      .from('safety_email_outbox')
      .select('id,checkin_id,contact_id,attempts')
      .eq('status', 'pending')
      .lte('next_attempt_at', new Date().toISOString())
      .limit(100)
    if (pendingEmailError) return Response.json({ error: pendingEmailError.message }, { status: 500 })

    for (const pending of (pendingEmails ?? []) as PendingEmergencyEmail[]) {
      const { data: claimed, error: claimEmailError } = await supabase
        .from('safety_email_outbox')
        .update({ status: 'processing', attempts: pending.attempts + 1, updated_at: new Date().toISOString() })
        .eq('id', pending.id)
        .eq('status', 'pending')
        .select('attempts')
        .maybeSingle()
      if (claimEmailError) return Response.json({ error: claimEmailError.message }, { status: 500 })
      if (!claimed) continue

      const { data: contact, error: contactError } = await supabase
        .from('emergency_contacts')
        .select('email')
        .eq('id', pending.contact_id)
        .maybeSingle()
      if (contactError) return Response.json({ error: contactError.message }, { status: 500 })

      const delivery = contact?.email
        ? await deliverEmergencyEmail(emailNotifier, {
            to: contact.email,
            subject: 'Missed safety check-in',
            body: 'A safety check-in has expired. Please contact your person and confirm they are safe.',
            metadata: { contact_id: pending.contact_id, checkin_id: pending.checkin_id },
          }, claimed.attempts)
        : { status: 'failed' as const, attempts: claimed.attempts, lastError: 'Emergency contact email is unavailable.' }

      const { error: emailStateError } = await supabase.from('safety_email_outbox').update({
        status: delivery.status,
        attempts: delivery.attempts,
        last_error: delivery.lastError,
        updated_at: new Date().toISOString(),
        ...(delivery.status === 'pending' ? { next_attempt_at: new Date(Date.now() + 5 * 60_000).toISOString() } : {}),
      }).eq('id', pending.id)
      if (emailStateError) return Response.json({ error: emailStateError.message }, { status: 500 })
      if (delivery.status === 'delivered') contactsConsidered += 1
      if (delivery.status === 'failed') {
        console.error('[check-missed-checkin] Emergency email permanently failed', { contact_id: pending.contact_id, checkin_id: pending.checkin_id })
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
