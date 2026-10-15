import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type UserLocation = {
  user_id: string
  couple_id: string
  battery_level: number | null
  is_charging: boolean | null
}
type CoupleLink = { inviter_id: string; accepted_by: string }
type PushDevice = { expo_push_token: string; preferences: Record<string, boolean> | null }

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !serviceRole) throw new Error('Missing Supabase Edge Function environment.')

const supabase = createClient(supabaseUrl, serviceRole)
const threshold = 20
const debounceMs = 30 * 60 * 1000

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (request.headers.get('Authorization') !== `Bearer ${serviceRole}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const { data: locations, error: locationsError } = await supabase
    .from('user_locations')
    .select('user_id,couple_id,battery_level,is_charging')
  if (locationsError) return Response.json({ error: locationsError.message }, { status: 500 })

  const { data: links, error: linksError } = await supabase
    .from('couple_links')
    .select('inviter_id,accepted_by')
    .eq('status', 'accepted')
  if (linksError) return Response.json({ error: linksError.message }, { status: 500 })

  let checked = 0
  let sent = 0
  const since = new Date(Date.now() - debounceMs).toISOString()

  for (const location of (locations ?? []) as UserLocation[]) {
    if (location.battery_level === null || location.battery_level > threshold || location.is_charging) continue
    checked += 1
    const link = (links ?? []).find((candidate: CoupleLink) =>
      candidate.inviter_id === location.user_id || candidate.accepted_by === location.user_id)
    const partnerId = link
      ? (link.inviter_id === location.user_id ? link.accepted_by : link.inviter_id)
      : null
    if (!partnerId) continue

    const { count, error: logError } = await supabase
      .from('battery_alert_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', location.user_id)
      .gte('notified_at', since)
    if (logError) return Response.json({ error: logError.message }, { status: 500 })
    if ((count ?? 0) > 0) continue

    const { data: devices, error: devicesError } = await supabase
      .from('push_devices')
      .select('expo_push_token,preferences')
      .eq('user_id', partnerId)
    if (devicesError) return Response.json({ error: devicesError.message }, { status: 500 })
    const eligible = ((devices ?? []) as PushDevice[])
      .filter((device) => device.preferences?.battery_low !== false)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name,email')
      .eq('id', location.user_id)
      .maybeSingle()
    const partnerName = profile?.full_name || profile?.email || 'Partner'
    const messages = eligible.map((device) => ({
      to: device.expo_push_token,
      sound: 'default',
      title: 'Battery low',
      body: `${partnerName}'s battery is at ${location.battery_level}%.`,
      data: { type: 'battery_low', userId: location.user_id, batteryLevel: location.battery_level },
    }))

    if (messages.length) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      })
      if (!response.ok) return Response.json({ error: 'Expo Push API rejected the notification' }, { status: 502 })
      await response.json()
      sent += messages.length

      const { error: insertError } = await supabase.from('battery_alert_log').insert({
        couple_id: location.couple_id,
        user_id: location.user_id,
        battery_level: location.battery_level,
      })
      if (insertError) return Response.json({ error: insertError.message }, { status: 500 })
    }
  }

    return Response.json({ checked, sent })
  } catch (err) {
    console.error('[check-battery] Unhandled error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
})
