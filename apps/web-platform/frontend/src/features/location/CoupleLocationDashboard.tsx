'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Battery, Clock3, Compass, MapPin, Navigation, Phone, PhoneCall, RefreshCw, Route, ShieldCheck, Smartphone, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import EmergencySOS from '@/features/location/EmergencySOS'
import { resolveSos } from '@/services/safety-sos'
import { createCheckin, type SafetyCheckin } from '@/services/safety-checkins'
import dynamic from 'next/dynamic'

const PairLocationMap = dynamic(() => import('@/features/location/PairLocationMap'), { ssr: false, loading: () => <div className="flex h-[430px] items-center justify-center rounded-btn bg-soft-tint text-sm text-text-2">Loading map…</div> })

type Profile = { id: string; email: string; full_name: string | null; avatar_url: string | null }
type LocationRow = { user_id: string; couple_id: string; latitude: number; longitude: number; accuracy: number | null; updated_at: string; battery_level: number | null; is_charging: boolean | null; network_type: string | null; device_name: string | null; app_version: string | null }
type HistoryRow = { id: string; user_id: string; latitude: number; longitude: number; accuracy: number | null; captured_at: string }
type EmergencyAlert = { id: string; reporter_id: string; latitude: number | null; longitude: number | null; created_at: string; resolved_at: string | null; resolved_by: string | null; resolution_note: string | null }
type SavedPlace = { id: string; name: string; latitude: number; longitude: number; radius_meters: number }
type GeofenceEvent = {
  id: string
  saved_place_id: string
  user_id: string
  event_type: 'entered' | 'exited'
  latitude: number
  longitude: number
  occurred_at: string
  notified: boolean
}
type CallEvent = { id: string; type: string; status: string; created_at: string; caller_id: string; receiver_id: string }
type AggregatedLocation = { grid_lat: number; grid_lon: number; points: number; first_seen: string; last_seen: string; avg_lat: number; avg_lon: number }
type Tab = 'live' | 'timeline' | 'places' | 'explored' | 'device' | 'calls' | 'safety'

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

export default function CoupleLocationDashboard() {
  const [tab, setTab] = useState<Tab>('live')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [checkins, setCheckins] = useState<SafetyCheckin[]>([])
  const [places, setPlaces] = useState<SavedPlace[]>([])
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([])
  const [aggregated, setAggregated] = useState<AggregatedLocation[]>([])
  const router = useRouter()
  const [calls, setCalls] = useState<CallEvent[]>([])
  const [placeForm, setPlaceForm] = useState({ name: '', latitude: '', longitude: '', radius: '100' })
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [webLocationStatus, setWebLocationStatus] = useState<'idle' | 'syncing' | 'synced' | 'denied'>('idle')
  const [lastWebSyncTime, setLastWebSyncTime] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) { router.push('/login'); return }
    setAuthUserId(user.id)

    const { data: link, error: linkError } = await supabase.from('couple_links').select('inviter_id, accepted_by, couple_id').or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
    if (linkError || !link?.accepted_by || !link.couple_id) { setError('No accepted linked partner is available yet.'); setLoading(false); return }
    // Both accepted couple members can access and sync location
    const userIds = [link.inviter_id, link.accepted_by]
    const [profilesResult, locationResult, historyResult, alertsResult, placesResult, callsResult, checkinsResult, geofenceEventsResult, aggregatedResult] = await Promise.all([
      supabase.from('profiles').select('id,email,full_name,avatar_url').in('id', userIds),
      supabase.from('user_locations').select('*').eq('couple_id', link.couple_id).in('user_id', userIds),
      supabase.from('location_history').select('id,user_id,latitude,longitude,accuracy,captured_at').eq('couple_id', link.couple_id).gte('captured_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('captured_at', { ascending: false }).limit(1500),
      supabase.from('emergency_alerts').select('id,reporter_id,latitude,longitude,created_at,resolved_at,resolved_by,resolution_note').eq('couple_id', link.couple_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('saved_places').select('id,name,latitude,longitude,radius_meters').eq('couple_id', link.couple_id).order('created_at', { ascending: false }),
      supabase.from('call_signals').select('id,type,status,created_at,caller_id,receiver_id').or(`caller_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`).order('created_at', { ascending: false }).limit(50),
      supabase.from('safety_checkins').select('*').eq('couple_id', link.couple_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('geofence_events').select('id,saved_place_id,user_id,event_type,latitude,longitude,occurred_at,notified').eq('couple_id', link.couple_id).order('occurred_at', { ascending: false }).limit(50),
      supabase.from('location_history_aggregated').select('*').order('points', { ascending: false }).limit(30),
    ])
    if (profilesResult.error || locationResult.error || historyResult.error || alertsResult.error || placesResult.error || callsResult.error || checkinsResult.error || geofenceEventsResult.error) { setError(profilesResult.error?.message || locationResult.error?.message || historyResult.error?.message || alertsResult.error?.message || placesResult.error?.message || callsResult.error?.message || checkinsResult.error?.message || geofenceEventsResult.error?.message || 'Unable to load location data.'); setLoading(false); return }
    setProfiles((profilesResult.data ?? []) as Profile[])
    setLocations((locationResult.data ?? []) as LocationRow[])
    setHistory((historyResult.data ?? []) as HistoryRow[])
    setAlerts((alertsResult.data ?? []) as EmergencyAlert[])
    setPlaces((placesResult.data ?? []) as SavedPlace[])
    setCalls((callsResult.data ?? []) as CallEvent[])
    setCheckins((checkinsResult.data ?? []) as SafetyCheckin[])
    setGeofenceEvents((geofenceEventsResult.data ?? []) as GeofenceEvent[])
    if (aggregatedResult.data) setAggregated(aggregatedResult.data as AggregatedLocation[])
    setSelectedUser((current) => current && userIds.includes(current) ? current : user.id)
    setLoading(false)
  }, [router])

  const syncBrowserLocation = useCallback(async (isMounted = true) => {
    if (typeof window === 'undefined' || !navigator.geolocation) return
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return

    const { data: link } = await supabase
      .from('couple_links')
      .select('couple_id')
      .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .eq('status', 'accepted')
      .maybeSingle()
    if (!link?.couple_id) return

    setWebLocationStatus('syncing')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await supabase.from('location_sharing_settings').upsert({
            user_id: user.id,
            enabled: true,
            last_permission_state: 'granted',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

          let batteryLevel: number | null = null
          let isCharging: boolean | null = null
          if ('getBattery' in navigator) {
            try {
              const battery = await (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean }> }).getBattery()
              batteryLevel = Math.round(battery.level * 100)
              isCharging = battery.charging
            } catch {
              // optional battery metrics
            }
          }

          const deviceStatus = {
            battery_level: batteryLevel,
            is_charging: isCharging,
            network_type: navigator.onLine ? 'online' : 'offline',
            device_name: 'Web Browser',
            app_version: 'Web 1.0',
            last_sync_at: new Date().toISOString(),
          }

          const { error: rpcErr } = await supabase.rpc('record_location_point', {
            p_couple_id: link.couple_id,
            p_latitude: pos.coords.latitude,
            p_longitude: pos.coords.longitude,
            p_accuracy: pos.coords.accuracy || 10,
            p_updated_at: new Date(pos.timestamp).toISOString(),
            p_status: deviceStatus,
          })

          if (rpcErr) {
            await supabase.from('user_locations').upsert({
              user_id: user.id,
              couple_id: link.couple_id,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 10,
              battery_level: batteryLevel,
              is_charging: isCharging,
              network_type: navigator.onLine ? 'online' : 'offline',
              device_name: 'Web Browser',
              app_version: 'Web 1.0',
              updated_at: new Date().toISOString(),
              last_sync_at: new Date().toISOString(),
            })
          }

          if (isMounted) {
            setWebLocationStatus('synced')
            setLastWebSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
            void load()
          }
        } catch (err) {
          console.warn('Web location update failed:', err)
          if (isMounted) setWebLocationStatus('idle')
        }
      },
      (err) => {
        console.warn('Geolocation lookup:', err.message)
        if (isMounted) setWebLocationStatus(err.code === 1 ? 'denied' : 'idle')
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
    )
  }, [load])

  useEffect(() => {
    void syncBrowserLocation(true)
    const interval = setInterval(() => {
      void syncBrowserLocation(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [syncBrowserLocation])

  const savePlace = async () => {
    const latitude = Number(placeForm.latitude)
    const longitude = Number(placeForm.longitude)
    const radius = Number(placeForm.radius)
    if (!placeForm.name.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isInteger(radius) || radius < 25 || radius > 10000) {
      setError('Enter a name, valid coordinates, and a whole-number radius from 25 to 10,000 meters.')
      return
    }
    const { data: authData } = await supabase.auth.getUser()
    const { data: link } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${authData.user?.id},accepted_by.eq.${authData.user?.id}`).eq('status', 'accepted').maybeSingle()
    if (!authData.user || !link?.couple_id) return
    const { data, error: saveError } = editingPlaceId
      ? await supabase.from('saved_places').update({ name: placeForm.name.trim(), radius_meters: radius }).eq('id', editingPlaceId).select('id,name,latitude,longitude,radius_meters').single()
      : await supabase.from('saved_places').insert({ couple_id: link.couple_id, created_by: authData.user.id, name: placeForm.name.trim(), latitude, longitude, radius_meters: radius }).select('id,name,latitude,longitude,radius_meters').single()
    if (saveError) { setError(saveError.message); return }
    setPlaces((current) => editingPlaceId ? current.map((place) => place.id === editingPlaceId ? data as SavedPlace : place) : [data as SavedPlace, ...current])
    setPlaceForm({ name: '', latitude: '', longitude: '', radius: '100' })
    setEditingPlaceId(null)
  }

  const editPlace = (place: SavedPlace) => {
    setEditingPlaceId(place.id)
    setPlaceForm({ name: place.name, latitude: String(place.latitude), longitude: String(place.longitude), radius: String(place.radius_meters) })
  }

  const cancelEditPlace = () => {
    setEditingPlaceId(null)
    setPlaceForm({ name: '', latitude: '', longitude: '', radius: '100' })
  }

  const deletePlace = async (id: string) => {
    const { error: deleteError } = await supabase.from('saved_places').delete().eq('id', id)
    if (deleteError) { setError(deleteError.message); return }
    setPlaces((current) => current.filter((place) => place.id !== id))
  }

  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const channel = supabase.channel('pair-location-live').on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, () => { void load() }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [load])

  const selectedLocation = locations.find((row) => row.user_id === selectedUser) ?? null
  const selectedProfile = profiles.find((row) => row.id === selectedUser) ?? null
  const selectedHistory = useMemo(() => history.filter((row) => row.user_id === selectedUser), [history, selectedUser])
  const profileNames = useMemo(() => Object.fromEntries(profiles.map((profile) => [profile.id, profile.full_name || profile.email])), [profiles])
  const tabs: { id: Tab; label: string; icon: typeof MapPin }[] = [
    { id: 'live', label: 'Live Map', icon: MapPin }, { id: 'timeline', label: 'Timeline', icon: Route }, { id: 'places', label: 'Saved Places', icon: Navigation }, { id: 'explored', label: 'Places Explored', icon: Compass }, { id: 'device', label: 'Device Status', icon: Smartphone }, { id: 'calls', label: 'App Calls', icon: PhoneCall }, { id: 'safety', label: 'Safety / SOS', icon: ShieldCheck },
  ]

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-text-2"><RefreshCw className="icon-pulse-soft mr-2 h-5 w-5 animate-spin" /> Loading paired location data…</div>
  if (error) return <section className="glass-card mx-auto max-w-2xl p-6 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-accent-1" /><h1 className="mt-3 text-2xl text-text-1">Location is not ready</h1><p className="mt-2 text-sm text-text-2">{error}</p></section>

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">Shared location dashboard</p>
        <h1 className="mt-2 text-3xl font-serif text-text-1">Location</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void syncBrowserLocation(true)}
          disabled={webLocationStatus === 'syncing'}
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition ${
            webLocationStatus === 'synced'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : webLocationStatus === 'syncing'
              ? 'border-accent-1/40 bg-accent-1/10 text-accent-1'
              : webLocationStatus === 'denied'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              : 'border-border bg-card text-text-2 hover:text-text-1'
          }`}
          title="Share current browser location to update partner map"
        >
          <MapPin className={`h-3.5 w-3.5 ${webLocationStatus === 'syncing' ? 'animate-bounce text-accent-1' : ''}`} />
          {webLocationStatus === 'syncing' && 'Syncing your live location…'}
          {webLocationStatus === 'synced' && `Live web location active (${lastWebSyncTime})`}
          {webLocationStatus === 'denied' && 'Location permission blocked'}
          {webLocationStatus === 'idle' && 'Sync My Live Location'}
        </button>
        <button type="button" onClick={() => void load()} className="glass-button inline-flex items-center gap-2 px-4 py-2 text-sm">
          <RefreshCw className="icon-pulse-soft h-4 w-4" /> Refresh
        </button>
      </div>
    </header>
    <nav className="flex gap-2 overflow-x-auto pb-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm ${tab === id ? 'border-accent-1/50 bg-accent-1/15 text-accent-1' : 'border-border bg-card text-text-2'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="glass-card min-h-[520px] overflow-hidden p-4">
        {tab === 'live' && <><PairLocationMap locations={locations} history={history} selectedUser={selectedUser} names={profileNames} places={places} alerts={alerts} /><div className="mt-4 grid gap-3 sm:grid-cols-2">{locations.map((row) => { const person = profiles.find((item) => item.id === row.user_id); return <a key={row.user_id} href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=16/${row.latitude}/${row.longitude}`} target="_blank" rel="noreferrer" className="rounded-btn border border-border/20 bg-soft-tint p-4 hover:border-accent-1/40"><p className="font-medium text-text-1">{person?.full_name || person?.email || 'Linked account'}</p><p className="mt-1 text-sm text-text-2">{row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}</p><p className="mt-2 text-xs text-accent-2">Updated {relativeTime(row.updated_at)} · ±{Math.round(row.accuracy ?? 0)}m</p></a>})}</div></>}
        {tab === 'timeline' && <Timeline rows={selectedHistory} />}
        {tab === 'places' && <div className="space-y-3 p-2"><h2 className="text-xl text-text-1">Saved places</h2><div className="grid gap-2 rounded-btn bg-soft-tint p-4 sm:grid-cols-2"><input value={placeForm.name} onChange={(event) => setPlaceForm((form) => ({ ...form, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-1" /><input value={placeForm.latitude} disabled={Boolean(editingPlaceId)} onChange={(event) => setPlaceForm((form) => ({ ...form, latitude: event.target.value }))} placeholder="Latitude" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-1" /><input value={placeForm.longitude} disabled={Boolean(editingPlaceId)} onChange={(event) => setPlaceForm((form) => ({ ...form, longitude: event.target.value }))} placeholder="Longitude" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-1" /><input value={placeForm.radius} onChange={(event) => setPlaceForm((form) => ({ ...form, radius: event.target.value }))} placeholder="Radius (25-10000m)" className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-1" /><button type="button" onClick={() => void savePlace()} className="glass-button sm:col-span-2">{editingPlaceId ? 'Update place' : 'Add place'}</button>{editingPlaceId ? <button type="button" onClick={cancelEditPlace} className="text-sm text-text-2 sm:col-span-2">Cancel edit</button> : null}</div>{places.map((place) => <div key={place.id} className="flex items-center justify-between rounded-btn bg-soft-tint p-4"><div><p className="font-medium text-text-1">{place.name}</p><p className="mt-1 text-sm text-text-2">{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)} · {place.radius_meters}m radius</p></div><div className="flex gap-3"><button type="button" onClick={() => editPlace(place)} className="text-sm text-accent-1">Edit</button><button type="button" onClick={() => void deletePlace(place.id)} className="text-sm text-error">Delete</button></div></div>)}{!places.length ? <EmptyPanel title="No saved places" text="Add a safe zone above." /> : null}</div>}
        {tab === 'places' && <div className="mt-6 space-y-3"><h2 className="text-xl text-text-1">Geofence events</h2>{geofenceEvents.length === 0 ? <EmptyPanel title="No geofence events" text="Enter/exit history will appear here." /> : geofenceEvents.map((event) => { const place = places.find((savedPlace) => savedPlace.id === event.saved_place_id); const isYou = event.user_id === authUserId; const direction = event.event_type === 'entered' ? 'Arrived at' : 'Left'; const when = new Date(event.occurred_at).toLocaleString(); return <div key={event.id} className="flex items-center justify-between rounded-btn bg-soft-tint p-4"><div><p className="font-medium text-text-1">{isYou ? 'You' : 'Partner'} {direction} {place?.name ?? 'a saved place'}</p><p className="mt-1 text-sm text-text-2">{when}</p>{!event.notified ? <p className="mt-1 text-xs text-text-2">Notified: pending</p> : null}</div></div> })}</div>}
        {tab === 'explored' && <div className="space-y-4 p-2"><div><h2 className="text-xl font-serif text-text-1">Places We Explored Together</h2><p className="mt-1 text-sm text-text-2">Coordinates and visited clusters aggregated over the last 7 days.</p></div>{aggregated.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">{aggregated.map((item, idx) => <a key={`${item.grid_lat}-${item.grid_lon}-${idx}`} href={`https://www.google.com/maps?q=${item.avg_lat},${item.avg_lon}`} target="_blank" rel="noreferrer" className="flex flex-col justify-between rounded-btn border border-border/30 bg-soft-tint p-4 transition hover:border-accent-1/40 hover:bg-card"><div><div className="flex items-center justify-between gap-2"><span className="font-semibold text-text-1">Explored Spot #{idx + 1}</span><span className="rounded-full bg-accent-1/10 px-2.5 py-0.5 text-xs font-semibold text-accent-1">{item.points} visits</span></div><p className="mt-2 text-sm text-text-2">{item.avg_lat.toFixed(5)}, {item.avg_lon.toFixed(5)}</p></div><div className="mt-3 flex items-center justify-between border-t border-border/30 pt-2 text-xs text-text-2"><span>First: {new Date(item.first_seen).toLocaleDateString()}</span><span className="font-medium text-accent-1">Open Map →</span></div></a>)}</div> : <EmptyPanel title="No travel clusters recorded yet" text="Visit places together while background location is active to see your shared travel map." />}</div>}
        {tab === 'device' && <DevicePanel location={selectedLocation} profile={selectedProfile} />}
        {tab === 'calls' && <div className="space-y-3 p-2"><h2 className="text-xl text-text-1">App call history</h2>{calls.map((call) => <div key={call.id} className="flex items-center gap-3 rounded-btn bg-soft-tint p-4">{call.type === 'video' ? <Video className="h-5 w-5 text-accent-1" /> : <Phone className="h-5 w-5 text-accent-1" />}<div><p className="font-medium text-text-1">{call.type === 'video' ? 'Video call' : 'Audio call'} · {call.status}</p><p className="text-sm text-text-2">{new Date(call.created_at).toLocaleString()}</p></div></div>)}{!calls.length ? <EmptyPanel title="No app calls" text="No in-app call events yet." /> : null}</div>}
        {tab === 'safety' && <SafetyPanel alerts={alerts} profiles={profiles} checkins={checkins} onChanged={load} />}
      </section>
      <aside className="space-y-3">{profiles.map((profile) => { const location = locations.find((row) => row.user_id === profile.id); const stale = !location || Date.now() - new Date(location.updated_at).getTime() > 10 * 60000; return <button key={profile.id} type="button" onClick={() => setSelectedUser(profile.id)} className={`w-full rounded-btn border p-4 text-left ${selectedUser === profile.id ? 'border-accent-1/50 bg-accent-1/10' : 'border-border bg-card'}`}><p className="font-medium text-text-1">{profile.full_name || profile.email}</p><p className={`mt-1 text-xs ${stale ? 'text-warning' : 'text-success'}`}>{stale ? 'Location stale or offline' : `Live · ${relativeTime(location.updated_at)}`}</p><p className="mt-2 text-xs text-text-2">{location ? `Battery ${location.battery_level ?? '—'}% · ${location.is_charging ? 'Charging' : 'Not charging'} · ${location.network_type ?? 'Network unknown'}` : 'No GPS update yet'}</p></button>})}</aside>
    </div>
  </div>
}

function Timeline({ rows }: Readonly<{ rows: HistoryRow[] }>) { return <div className="space-y-3 p-2"><h2 className="text-xl text-text-1">Last seven days</h2>{rows.length ? rows.slice(0, 80).map((row) => <a key={row.id} href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-btn bg-soft-tint p-4"><div><p className="font-medium text-text-1">{row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}</p><p className="mt-1 text-xs text-text-2">±{Math.round(row.accuracy ?? 0)}m</p></div><span className="text-sm text-accent-2">{new Date(row.captured_at).toLocaleString()}</span></a>) : <EmptyPanel title="No route history yet" text="Background tracking will add points here once the mobile app has location permission." />}</div> }
function DevicePanel({ location, profile }: Readonly<{ location: LocationRow | null; profile: Profile | null }>) { return <div className="space-y-4 p-2"><h2 className="text-xl text-text-1">{profile?.full_name || profile?.email || 'Device'} status</h2>{location ? <><Metric icon={Battery} label="Battery" value={location.battery_level === null ? 'Not reported' : `${location.battery_level}%${location.is_charging ? ' · Charging' : ''}`} /><Metric icon={Navigation} label="Network" value={location.network_type ?? 'Not reported'} /><Metric icon={Smartphone} label="Device" value={`${location.device_name ?? 'Not reported'} · app ${location.app_version ?? '—'}`} /><Metric icon={Clock3} label="Last sync" value={`${new Date(location.updated_at).toLocaleString()} · ±${Math.round(location.accuracy ?? 0)}m`} /></> : <EmptyPanel title="No device data" text="This device has not sent a location update yet." />}</div> }
function Metric({ icon: Icon, label, value }: Readonly<{ icon: typeof Battery; label: string; value: string }>) { return <div className="flex gap-3 rounded-btn bg-soft-tint p-4"><Icon className="h-5 w-5 text-accent-1" /><div><p className="text-xs uppercase tracking-[0.16em] text-text-2">{label}</p><p className="mt-1 text-sm text-text-1">{value}</p></div></div> }
function EmptyPanel({ title, text }: Readonly<{ title: string; text: string }>) { return <div className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center"><h2 className="text-xl text-text-1">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-text-2">{text}</p></div> }
function SafetyPanel({ alerts, profiles, checkins, onChanged }: Readonly<{ alerts: EmergencyAlert[]; profiles: Profile[]; checkins: SafetyCheckin[]; onChanged: () => void }>) {
  const handleResolve = async (alert: EmergencyAlert) => {
    if (!window.confirm('Resolve this SOS alert?')) return
    const note = window.prompt('Optional resolution note:', '') ?? ''
    try {
      await resolveSos(alert.id, note)
      onChanged()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to resolve SOS.')
    }
  }
  const startCheckin = async (type: SafetyCheckin['checkinType'], label: string) => {
    if (!window.confirm(`${label}?`)) return
    const message = window.prompt('Optional note:', '') ?? ''
    const expected = window.prompt('Optional expected time (ISO, e.g. 2026-09-16T00:00:00+06:30):', '') ?? ''
    const expectedUntil = expected.trim() ? new Date(expected.trim()).toISOString() : null
    if (expected.trim() && Number.isNaN(new Date(expected.trim()).getTime())) {
      window.alert('Enter a valid date and time.')
      return
    }
    try {
      const checkin = await createCheckin({ checkinType: type, message: message.trim() || null, latitude: null, longitude: null, accuracy: null, expectedUntil })
      const { error } = await supabase.functions.invoke('checkin-notify', { body: { checkinId: checkin.id, type } })
      if (error) throw error
      onChanged()
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Unable to send check-in.') }
  }
  return <div className="space-y-4 p-2"><EmergencySOS onSOS={() => onChanged()} /><div className="grid grid-cols-3 gap-3"><button type="button" onClick={() => void startCheckin('safe', 'I am safe')} className="rounded-xl bg-success p-3 text-sm font-medium text-[color:var(--accent-foreground)]">I am safe</button><button type="button" onClick={() => void startCheckin('need_help', 'I need help')} className="rounded-xl bg-error p-3 text-sm font-medium text-text-1">I need help</button><button type="button" onClick={() => void startCheckin('home', 'I am home')} className="rounded-xl bg-accent-1 p-3 text-sm font-medium text-[color:var(--accent-foreground)]">I am home</button></div>{checkins.slice(0, 5).map((checkin) => <div key={checkin.id} className="rounded-xl bg-soft-tint p-3 text-sm text-text-2"><p className="font-medium text-text-1">{checkin.checkinType.replace('_', ' ')} · {checkin.status}</p><p>{new Date(checkin.createdAt).toLocaleString()}{checkin.expectedUntil ? ` · expected by ${new Date(checkin.expectedUntil).toLocaleString()}` : ''}</p></div>)}<h2 className="text-xl text-text-1">Recent SOS alerts</h2>{alerts.length ? alerts.map((alert) => <div key={alert.id} className="block rounded-btn border border-error/30 bg-error/10 p-4"><a href={alert.latitude !== null && alert.longitude !== null ? `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}` : '#'} target="_blank" rel="noreferrer"><p className="font-medium text-error">🆘 {profiles.find((profile) => profile.id === alert.reporter_id)?.full_name || 'Partner'} sent an SOS</p><p className="mt-1 text-sm text-text-2">{new Date(alert.created_at).toLocaleString()} · {alert.latitude !== null ? 'open map' : 'location unavailable'}</p></a>{alert.resolved_at ? <div className="mt-3 text-sm text-text-2"><p>Resolved by {profiles.find((profile) => profile.id === alert.resolved_by)?.full_name || 'Partner'} on {new Date(alert.resolved_at).toLocaleString()}</p>{alert.resolution_note ? <p className="mt-1">Note: {alert.resolution_note}</p> : null}</div> : <button type="button" onClick={() => void handleResolve(alert)} className="mt-3 rounded-lg bg-success px-3 py-2 text-sm font-medium text-[color:var(--accent-foreground)]">Resolve</button>}</div>) : <p className="rounded-btn bg-soft-tint p-4 text-sm text-text-2">No SOS alerts yet.</p>}</div>
}
