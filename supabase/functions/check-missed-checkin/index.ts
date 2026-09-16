import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SafetyCheckin = {
  id: string
  couple_id: string
  user_id: string
  checkin_type: 'safe' | 'need_help' | 'home'
  status: 'pending' | 'expired'
  message: string | null
  expected_until: string | null
}
type CoupleLink = { inviter_id: string; accepted_by: string }
type PushDevice = { expo_push_token: string; preferences: Record<string, boolean> | null }
type EmergencyContact = {
  email: string | null
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !serviceRole) throw new Error('Missing Supabase Edge Function environment.')

const supabase = createClient(supabaseUrl, serviceRole)

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (request.headers.get('Authorization') !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { data: checkins, error: checkinsError } = await supabase
      .from('safety_checkins')
      .select('id,couple_id,user_id,checkin_type,status,message,expected_until')
      .eq('status', 'pending')
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
      const { error: updateError } = await supabase
        .from('safety_checkins')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', checkin.id)
      if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
      processed += 1

      const link = (links ?? []).find((candidate: CoupleLink) =>
        candidate.inviter_id === checkin.user_id || candidate.accepted_by === checkin.user_id)
      const partnerId = link
        ? (link.inviter_id === checkin.user_id ? link.accepted_by : link.inviter_id)
        : null
      if (!partnerId) continue

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

      if (messages.length) {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        })
        if (!response.ok) {
          return Response.json({ error: 'Expo Push API rejected the notification' }, { status: 502 })
        }
        await response.json()
        notified += messages.length
      }

      const { data: contacts, error: contactsError } = await supabase
        .from('emergency_contacts')
        .select('email')
        .eq('couple_id', checkin.couple_id)
        .eq('is_active', true)
        .eq('notify_on_checkin_missed', true)
      if (contactsError) return Response.json({ error: contactsError.message }, { status: 500 })
      contactsConsidered += (contacts ?? []).length
      for (const contact of (contacts ?? []) as EmergencyContact[]) {
        if (contact.email) {
          // TODO(phase-21.4): integrate email provider.
          // eslint-disable-next-line no-console
          console.log('[check-missed-checkin] Would email:', contact.email, 'about checkin', checkin.id)
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
