import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { haversine } from '../_shared/haversine.ts'

type SavedPlace = {
  id: string
  couple_id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
}

type UserLocation = {
  user_id: string
  couple_id: string
  latitude: number
  longitude: number
}

type CoupleLink = {
  inviter_id: string
  accepted_by: string
}

type PushDevice = {
  expo_push_token: string
  preferences: Record<string, boolean> | null
}

type GeofenceEvent = {
  id: string
  couple_id: string
  user_id: string
  saved_place_id: string
  event_type: 'entered' | 'exited'
  latitude: number
  longitude: number
  occurred_at: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRole) {
  throw new Error('Missing Supabase Edge Function environment.')
}

const supabase = createClient(supabaseUrl, serviceRole)

function unauthorized(request: Request): boolean {
  return request.headers.get('Authorization') !== `Bearer ${serviceRole}`
}

async function notifyPartner(
  event: GeofenceEvent,
  place: SavedPlace,
  partnerId: string,
  userId: string,
): Promise<boolean> {
  const { data: devices, error: devicesError } = await supabase
    .from('push_devices')
    .select('expo_push_token,preferences')
    .eq('user_id', partnerId)

  if (devicesError) throw devicesError

  const eligible = ((devices ?? []) as PushDevice[])
    .filter((device) => device.preferences?.geofence !== false)
  if (!eligible.length) return true

  const entered = event.event_type === 'entered'
  const messages = eligible.map((device) => ({
    to: device.expo_push_token,
    sound: 'default',
    title: entered ? `Arrived at ${place.name}` : `Left ${place.name}`,
    body: entered
      ? 'Your partner arrived at a saved place.'
      : 'Your partner left a saved place.',
    data: {
      type: 'geofence',
      eventType: event.event_type,
      eventId: event.id,
      userId,
      placeId: place.id,
    },
  }))

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  })
  if (!response.ok) return false
  await response.json()
  return true
}

async function processLocation(
  location: UserLocation,
  places: SavedPlace[],
  links: CoupleLink[],
): Promise<{ inserted: number; notified: number }> {
  const link = links.find((candidate) =>
    candidate.inviter_id === location.user_id || candidate.accepted_by === location.user_id)
  const partnerId = link
    ? (link.inviter_id === location.user_id ? link.accepted_by : link.inviter_id)
    : null
  if (!partnerId) return { inserted: 0, notified: 0 }

  let inserted = 0
  let notified = 0
  const couplePlaces = places.filter((place) => place.couple_id === location.couple_id)

  for (const place of couplePlaces) {
    const distance = haversine(
      location.latitude,
      location.longitude,
      place.latitude,
      place.longitude,
    )
    const eventType = distance <= place.radius_meters ? 'entered' : 'exited'
    const { data: recent, error: recentError } = await supabase
      .from('geofence_events')
      .select('event_type,occurred_at')
      .eq('user_id', location.user_id)
      .eq('saved_place_id', place.id)
      .order('occurred_at', { ascending: false })
      .limit(1)

    if (recentError) throw recentError
    const previousEvent = recent?.[0]
    const isInitialExit = !previousEvent && eventType === 'exited'
    const isSameAsPrevious = previousEvent?.event_type === eventType
    if (isSameAsPrevious) continue

    const { data: event, error: insertError } = await supabase
      .from('geofence_events')
      .insert({
        couple_id: location.couple_id,
        user_id: location.user_id,
        saved_place_id: place.id,
        event_type: eventType,
        latitude: location.latitude,
        longitude: location.longitude,
        notified: isInitialExit,
      })
      .select('id,couple_id,user_id,saved_place_id,event_type,latitude,longitude,occurred_at')
      .single()

    if (insertError) throw insertError
    inserted += 1

    if (isInitialExit) continue

    const wasNotified = await notifyPartner(event as GeofenceEvent, place, partnerId, location.user_id)
    if (wasNotified) {
      const { error: updateError } = await supabase
        .from('geofence_events')
        .update({ notified: true })
        .eq('id', (event as GeofenceEvent).id)
      if (updateError) throw updateError
      notified += 1
    }
  }

  return { inserted, notified }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (unauthorized(request)) return new Response('Unauthorized', { status: 401 })

  try {
    const { data: places, error: placesError } = await supabase
      .from('saved_places')
      .select('id,couple_id,name,latitude,longitude,radius_meters')
    if (placesError) return Response.json({ error: placesError.message }, { status: 500 })

    const { data: locations, error: locationsError } = await supabase
      .from('user_locations')
      .select('user_id,couple_id,latitude,longitude')
    if (locationsError) return Response.json({ error: locationsError.message }, { status: 500 })

    const { data: links, error: linksError } = await supabase
      .from('couple_links')
      .select('inviter_id,accepted_by')
      .eq('status', 'accepted')
    if (linksError) return Response.json({ error: linksError.message }, { status: 500 })

    let inserted = 0
    let notified = 0
    for (const location of (locations ?? []) as UserLocation[]) {
      const result = await processLocation(
        location,
        (places ?? []) as SavedPlace[],
        (links ?? []) as CoupleLink[],
      )
      inserted += result.inserted
      notified += result.notified
    }

    return Response.json({
      checked: (locations ?? []).length,
      places: (places ?? []).length,
      inserted,
      notified,
    })
  } catch (err) {
    console.error('[check-geofence] Unhandled error:', err)
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
})
