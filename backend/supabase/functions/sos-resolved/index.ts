import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type PushDevice = { expo_push_token: string }

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !serviceRole) throw new Error('Missing Supabase Edge Function environment.')

const supabase = createClient(supabaseUrl, serviceRole)

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const authorization = request.headers.get('Authorization')
  if (!authorization) return new Response('Unauthorized', { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.replace(/^Bearer\s+/i, ''))
  if (authError || !user) return new Response('Unauthorized', { status: 401 })
  const body = await request.json().catch(() => null) as { alertId?: string; note?: string } | null
  if (!body?.alertId) return Response.json({ error: 'alertId is required' }, { status: 400 })

  const { data: alert } = await supabase
    .from('emergency_alerts')
    .select('id,reporter_id,couple_id')
    .eq('id', body.alertId)
    .maybeSingle()
  if (!alert) return Response.json({ sent: 0 })
  if (alert.reporter_id === user.id) return new Response('Forbidden', { status: 403 })

  const { data: link } = await supabase
    .from('couple_links')
    .select('inviter_id,accepted_by')
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()
  if (!link || ![link.inviter_id, link.accepted_by].includes(alert.reporter_id)) {
    return new Response('Forbidden', { status: 403 })
  }

  const { data: devices, error: devicesError } = await supabase
    .from('push_devices')
    .select('expo_push_token')
    .eq('user_id', alert.reporter_id)
  if (devicesError) return Response.json({ error: devicesError.message }, { status: 500 })

  const messages = ((devices ?? []) as PushDevice[]).map((device) => ({
    to: device.expo_push_token,
    sound: 'default',
    title: 'SOS resolved',
    body: body.note ? `Your partner resolved the SOS: ${body.note}` : 'Your partner resolved your SOS alert.',
    data: { type: 'sos_resolved', alertId: alert.id, resolvedBy: user.id },
  }))
  if (!messages.length) return Response.json({ sent: 0 })
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  })
  return Response.json({ sent: messages.length }, { status: response.ok ? 200 : 502 })
})
