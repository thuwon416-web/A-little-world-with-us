import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type PushDevice = { expo_push_token: string; preferences: Record<string, boolean> | null }
type Checkin = { id: string; couple_id: string; user_id: string; checkin_type: 'safe' | 'need_help' | 'home'; message: string | null; expected_until: string | null }

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

  const body = await request.json().catch(() => null) as { checkinId?: string; type?: Checkin['checkin_type'] } | null
  if (!body?.checkinId || !body.type || !['safe', 'need_help', 'home'].includes(body.type)) {
    return Response.json({ error: 'checkinId and a valid type are required' }, { status: 400 })
  }

  const { data: checkin } = await supabase
    .from('safety_checkins')
    .select('id,couple_id,user_id,checkin_type,message,expected_until')
    .eq('id', body.checkinId)
    .maybeSingle()
  if (!checkin || checkin.user_id !== user.id || checkin.checkin_type !== body.type) {
    return new Response('Forbidden', { status: 403 })
  }

  const { data: link } = await supabase
    .from('couple_links')
    .select('inviter_id,accepted_by')
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()
  if (!link) return Response.json({ sent: 0 })
  const partnerId = link.inviter_id === user.id ? link.accepted_by : link.inviter_id

  const statusUpdate = checkin.expected_until
    ? { status: 'pending' }
    : { status: 'completed', completed_at: new Date().toISOString() }
  const { error: statusError } = await supabase.from('safety_checkins').update(statusUpdate).eq('id', checkin.id)
  if (statusError) return Response.json({ error: statusError.message }, { status: 500 })

  const { data: devices, error: devicesError } = await supabase
    .from('push_devices')
    .select('expo_push_token,preferences')
    .eq('user_id', partnerId)
  if (devicesError) return Response.json({ error: devicesError.message }, { status: 500 })

  const urgent = body.type === 'need_help'
  const title = body.type === 'safe' ? 'Partner is safe' : body.type === 'home' ? 'Partner is home' : 'Partner needs help'
  const fallback = body.type === 'safe' ? 'Your partner checked in as safe.' : body.type === 'home' ? 'Your partner checked in from home.' : 'Your partner requested help.'
  const messages = ((devices ?? []) as PushDevice[])
    .filter((device) => device.preferences?.checkin !== false)
    .map((device) => ({
      to: device.expo_push_token,
      sound: 'default',
      priority: urgent ? 'high' : 'default',
      title,
      body: checkin.message || fallback,
      data: { type: 'safety_checkin', checkinType: body.type, checkinId: checkin.id, userId: user.id },
    }))
  if (!messages.length) return Response.json({ sent: 0, status: statusUpdate.status })

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  })
  return Response.json({ sent: messages.length, status: statusUpdate.status }, { status: response.ok ? 200 : 502 })
})
