import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Device = { expo_push_token: string }
const url = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const jobSecret = Deno.env.get('SURPRISE_REVEAL_SECRET')
if (!url || !serviceRole) throw new Error('Missing Supabase Edge Function environment.')
const supabase = createClient(url, serviceRole)

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!jobSecret || request.headers.get('x-job-secret') !== jobSecret) return new Response('Unauthorized', { status: 401 })
  const { data: due, error } = await supabase.from('time_capsules').select('id,recipient_id,title').eq('status', 'scheduled').lte('unlock_at', new Date().toISOString())
  if (error) return Response.json({ error: error.message }, { status: 500 })
  let revealed = 0
  for (const capsule of due ?? []) {
    const { data: updated } = await supabase.from('time_capsules').update({ status: 'revealed', revealed_at: new Date().toISOString() }).eq('id', capsule.id).eq('status', 'scheduled').select('id').maybeSingle()
    if (!updated) continue
    revealed += 1
    await supabase.from('notifications').insert({ user_id: capsule.recipient_id, title: 'A surprise is ready', body: capsule.title, scheduled_at: new Date().toISOString() })
    const { data: devices } = await supabase.from('push_devices').select('expo_push_token').eq('user_id', capsule.recipient_id)
    const messages = (devices ?? []).map((device: Device) => ({ to: device.expo_push_token, sound: 'default', title: 'A surprise is ready', body: capsule.title, data: { type: 'surprise', capsuleId: capsule.id } }))
    if (messages.length) await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages) })
  }
  return Response.json({ revealed })
})
