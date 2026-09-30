import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRole) throw new Error('Missing Supabase Edge Function environment.')

const supabase = createClient(supabaseUrl, serviceRole)

function grid(value: number) {
  return Math.round(value / 0.002) * 0.002
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const authorization = request.headers.get('Authorization')
  if (!authorization) return new Response('Unauthorized', { status: 401 })
  const { data: { user } } = await supabase.auth.getUser(authorization.replace(/^Bearer\s+/i, ''))
  const body = await request.json().catch(() => null) as { latitude?: number; longitude?: number } | null
  if (!user || typeof body?.latitude !== 'number' || typeof body.longitude !== 'number') {
    return Response.json({ error: 'Authorized coordinates are required' }, { status: 400 })
  }

  const latitude = grid(body.latitude)
  const longitude = grid(body.longitude)
  const gridKey = `${latitude.toFixed(3)}:${longitude.toFixed(3)}`
  const { data: cached } = await supabase.from('location_address_cache').select('label').eq('grid_key', gridKey).maybeSingle()
  if (cached?.label) return Response.json({ label: cached.label, cached: true })

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14`, {
    headers: { 'User-Agent': 'A-Little-World-With-Us/1.0 (location label cache)' },
  })
  if (!response.ok) return Response.json({ label: null, cached: false }, { status: 202 })
  const result = await response.json() as { display_name?: string; address?: { suburb?: string; city?: string; town?: string; village?: string; country?: string } }
  const locality = result.address?.suburb ?? result.address?.city ?? result.address?.town ?? result.address?.village
  const label = [locality, result.address?.country].filter(Boolean).join(', ') || result.display_name || 'Unknown place'
  await supabase.from('location_address_cache').upsert({ grid_key: gridKey, latitude, longitude, label, cached_at: new Date().toISOString() })
  await supabase.from('user_locations').update({ place_label: label }).eq('user_id', user.id)
  await supabase
    .from('location_history')
    .update({ place_label: label })
    .eq('user_id', user.id)
    .is('place_label', null)
    .gte('captured_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
  return Response.json({ label, cached: false })
})
