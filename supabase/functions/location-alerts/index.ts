import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type PushDevice = { expo_push_token: string; preferences: Record<string, boolean> | null }

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRole) throw new Error('Missing Supabase Edge Function environment.')

const supabase = createClient(supabaseUrl, serviceRole)

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const authorization = request.headers.get('Authorization')
  if (!authorization) return new Response('Unauthorized', { status: 401 })

  const token = authorization.replace(/^Bearer\s+/i, '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json().catch(() => null) as { type?: 'sos' | 'sharing_stopped' | 'location_stale'; userId?: string; title?: string; message?: string } | null
  if (!body?.type || !body.userId) return Response.json({ error: 'type and userId are required' }, { status: 400 })
  if (body.userId !== user.id) return new Response('Forbidden', { status: 403 })

  const { data: link } = await supabase.from('couple_links')
    .select('inviter_id,accepted_by')
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${body.userId},accepted_by.eq.${body.userId}`)
    .maybeSingle()
  if (!link) return Response.json({ sent: 0 })

  const { data: pairProfiles } = await supabase.from('profiles').select('id,role').in('id', [link.inviter_id, link.accepted_by])
  const recipientId = pairProfiles?.find((profile) => profile.role === 'admin')?.id
  if (!recipientId) return Response.json({ sent: 0 })
  const { data: devices } = await supabase.from('push_devices').select('expo_push_token,preferences').eq('user_id', recipientId)
  const eligible = ((devices ?? []) as PushDevice[]).filter((device) => device.preferences?.[body.type] !== false)
  if (!eligible.length) return Response.json({ sent: 0 })

  const messages = eligible.map((device) => ({
    to: device.expo_push_token,
    sound: 'default',
    title: body.title ?? (body.type === 'sos' ? 'Safety alert' : 'Location sharing update'),
    body: body.message ?? (body.type === 'sos' ? 'Your partner sent an SOS alert.' : 'Check the location safety dashboard.'),
    data: { type: body.type, userId: body.userId },
  }))
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(messages),
  })
  return Response.json({ sent: messages.length, expo: await response.json() }, { status: response.ok ? 200 : 502 })
})
