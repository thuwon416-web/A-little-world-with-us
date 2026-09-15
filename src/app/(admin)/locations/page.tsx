'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Battery, Clock3, MapPin, Navigation, Phone, PhoneCall, RefreshCw, Route, ShieldCheck, Smartphone, Video } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import EmergencySOS from '@/features/location/EmergencySOS'
import { resolveSos } from '@/services/safety-sos'
import { createCheckin, type SafetyCheckin } from '@/services/safety-checkins'
import dynamic from 'next/dynamic'

const PairLocationMap = dynamic(() => import('@/features/location/PairLocationMap'), { ssr: false, loading: () => <div className="flex h-[430px] items-center justify-center rounded-2xl bg-[var(--bg-2)] text-sm text-[var(--text-secondary)]">Loading map…</div> })

type Profile = { id: string; email: string; full_name: string | null; avatar_url: string | null }
type LocationRow = { user_id: string; couple_id: string; latitude: number; longitude: number; accuracy: number | null; updated_at: string; battery_level: number | null; is_charging: boolean | null; network_type: string | null; device_name: string | null; app_version: string | null }
type HistoryRow = { id: string; user_id: string; latitude: number; longitude: number; accuracy: number | null; captured_at: string }
type EmergencyAlert = { id: string; reporter_id: string; latitude: number | null; longitude: number | null; created_at: string; resolved_at: string | null; resolved_by: string | null; resolution_note: string | null }
type SavedPlace = { id: string; name: string; latitude: number; longitude: number; radius_meters: number }
type CallEvent = { id: string; type: string; status: string; created_at: string; caller_id: string; receiver_id: string }
type Tab = 'live' | 'timeline' | 'places' | 'device' | 'calls' | 'safety'

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

export default function AdminLocationsPage() {
  const [tab, setTab] = useState<Tab>('live')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [checkins, setCheckins] = useState<SafetyCheckin[]>([])
  const [places, setPlaces] = useState<SavedPlace[]>([])
  const [calls, setCalls] = useState<CallEvent[]>([])
  const [placeForm, setPlaceForm] = useState({ name: '', latitude: '', longitude: '', radius: '100' })
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) { window.location.assign('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('role, email').eq('id', user.id).maybeSingle()
    if (profile?.role !== 'admin' || profile.email !== 'thuwon416@gmail.com') { window.location.assign('/dashboard'); return }

    const { data: link, error: linkError } = await supabase.from('couple_links').select('inviter_id, accepted_by, couple_id').or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
    if (linkError || !link?.accepted_by || !link.couple_id) { setError('No accepted linked partner is available yet.'); setLoading(false); return }
    const userIds = [link.inviter_id, link.accepted_by]
    const [profilesResult, locationResult, historyResult, alertsResult, placesResult, callsResult, checkinsResult] = await Promise.all([
      supabase.from('profiles').select('id,email,full_name,avatar_url').in('id', userIds),
      supabase.from('user_locations').select('*').eq('couple_id', link.couple_id).in('user_id', userIds),
      supabase.from('location_history').select('id,user_id,latitude,longitude,accuracy,captured_at').eq('couple_id', link.couple_id).gte('captured_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('captured_at', { ascending: false }).limit(1500),
      supabase.from('emergency_alerts').select('id,reporter_id,latitude,longitude,created_at,resolved_at,resolved_by,resolution_note').eq('couple_id', link.couple_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('saved_places').select('id,name,latitude,longitude,radius_meters').eq('couple_id', link.couple_id).order('created_at', { ascending: false }),
      supabase.from('call_signals').select('id,type,status,created_at,caller_id,receiver_id').or(`caller_id.in.(${userIds.join(',')}),receiver_id.in.(${userIds.join(',')})`).order('created_at', { ascending: false }).limit(50),
      supabase.from('safety_checkins').select('*').eq('couple_id', link.couple_id).order('created_at', { ascending: false }).limit(20),
    ])
    if (profilesResult.error || locationResult.error || historyResult.error || alertsResult.error || placesResult.error || callsResult.error || checkinsResult.error) { setError(profilesResult.error?.message || locationResult.error?.message || historyResult.error?.message || alertsResult.error?.message || placesResult.error?.message || callsResult.error?.message || checkinsResult.error?.message || 'Unable to load location data.'); setLoading(false); return }
    setProfiles((profilesResult.data ?? []) as Profile[])
    setLocations((locationResult.data ?? []) as LocationRow[])
    setHistory((historyResult.data ?? []) as HistoryRow[])
    setAlerts((alertsResult.data ?? []) as EmergencyAlert[])
    setPlaces((placesResult.data ?? []) as SavedPlace[])
    setCalls((callsResult.data ?? []) as CallEvent[])
    setCheckins((checkinsResult.data ?? []) as SafetyCheckin[])
    setSelectedUser((current) => current && userIds.includes(current) ? current : user.id)
    setLoading(false)
  }, [])

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
    const { data, error: saveError } = await supabase.from('saved_places').insert({ couple_id: link.couple_id, created_by: authData.user.id, name: placeForm.name.trim(), latitude, longitude, radius_meters: radius }).select('id,name,latitude,longitude,radius_meters').single()
    if (saveError) { setError(saveError.message); return }
    setPlaces((current) => [data as SavedPlace, ...current])
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
    { id: 'live', label: 'Live Map', icon: MapPin }, { id: 'timeline', label: 'Timeline', icon: Route }, { id: 'places', label: 'Saved Places', icon: Navigation }, { id: 'device', label: 'Device Status', icon: Smartphone }, { id: 'calls', label: 'App Calls', icon: PhoneCall }, { id: 'safety', label: 'Safety / SOS', icon: ShieldCheck },
  ]

  if (loading) return <div className="flex min-h-[400px] items-center justify-center text-[var(--text-secondary)]"><RefreshCw className="icon-pulse-soft mr-2 h-5 w-5 animate-spin" /> Loading paired location data…</div>
  if (error) return <section className="glass-card mx-auto max-w-2xl p-6 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-[var(--accent-1)]" /><h1 className="mt-3 text-2xl text-[var(--text-primary)]">Location is not ready</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p></section>

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Pair safety dashboard</p><h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Location</h1></div><button type="button" onClick={() => void load()} className="glass-button inline-flex items-center gap-2 px-4 py-2 text-sm"><RefreshCw className="icon-pulse-soft h-4 w-4" /> Refresh</button></header>
    <nav className="flex gap-2 overflow-x-auto pb-1">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm ${tab === id ? 'border-[var(--accent-1)]/50 bg-[var(--accent-1)]/15 text-[var(--accent-1)]' : 'border-white/10 bg-[var(--card-bg)] text-[var(--text-secondary)]'}`}><Icon className="h-4 w-4" />{label}</button>)}</nav>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="glass-card min-h-[520px] overflow-hidden p-4">
        {tab === 'live' && <><PairLocationMap locations={locations} history={history} selectedUser={selectedUser} names={profileNames} places={places} alerts={alerts} /><div className="mt-4 grid gap-3 sm:grid-cols-2">{locations.map((row) => { const person = profiles.find((item) => item.id === row.user_id); return <a key={row.user_id} href={`https://www.openstreetmap.org/?mlat=${row.latitude}&mlon=${row.longitude}#map=16/${row.latitude}/${row.longitude}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-[var(--bg-2)] p-4 hover:border-[var(--accent-1)]/40"><p className="font-medium text-[var(--text-primary)]">{person?.full_name || person?.email || 'Linked account'}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}</p><p className="mt-2 text-xs text-[var(--accent-2)]">Updated {relativeTime(row.updated_at)} · ±{Math.round(row.accuracy ?? 0)}m</p></a>})}</div></>}
        {tab === 'timeline' && <Timeline rows={selectedHistory} />}
        {tab === 'places' && <div className="space-y-3 p-2"><h2 className="text-xl text-[var(--text-primary)]">Saved places</h2><div className="grid gap-2 rounded-2xl bg-[var(--bg-2)] p-4 sm:grid-cols-2"><input value={placeForm.name} onChange={(event) => setPlaceForm((form) => ({ ...form, name: event.target.value }))} placeholder="Name" className="rounded-xl border border-white/10 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]" /><input value={placeForm.latitude} onChange={(event) => setPlaceForm((form) => ({ ...form, latitude: event.target.value }))} placeholder="Latitude" className="rounded-xl border border-white/10 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]" /><input value={placeForm.longitude} onChange={(event) => setPlaceForm((form) => ({ ...form, longitude: event.target.value }))} placeholder="Longitude" className="rounded-xl border border-white/10 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]" /><input value={placeForm.radius} onChange={(event) => setPlaceForm((form) => ({ ...form, radius: event.target.value }))} placeholder="Radius (25-10000m)" className="rounded-xl border border-white/10 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]" /><button type="button" onClick={() => void savePlace()} className="glass-button sm:col-span-2">Add place</button></div>{places.map((place) => <div key={place.id} className="flex items-center justify-between rounded-2xl bg-[var(--bg-2)] p-4"><div><p className="font-medium text-[var(--text-primary)]">{place.name}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)} · {place.radius_meters}m radius</p></div><button type="button" onClick={() => void deletePlace(place.id)} className="text-sm text-red-300">Delete</button></div>)}{!places.length ? <EmptyPanel title="No saved places" text="Add a safe zone above." /> : null}</div>}
        {tab === 'device' && <DevicePanel location={selectedLocation} profile={selectedProfile} />}
        {tab === 'calls' && <div className="space-y-3 p-2"><h2 className="text-xl text-[var(--text-primary)]">App call history</h2>{calls.map((call) => <div key={call.id} className="flex items-center gap-3 rounded-2xl bg-[var(--bg-2)] p-4">{call.type === 'video' ? <Video className="h-5 w-5 text-[var(--accent-1)]" /> : <Phone className="h-5 w-5 text-[var(--accent-1)]" />}<div><p className="font-medium text-[var(--text-primary)]">{call.type === 'video' ? 'Video call' : 'Audio call'} · {call.status}</p><p className="text-sm text-[var(--text-secondary)]">{new Date(call.created_at).toLocaleString()}</p></div></div>)}{!calls.length ? <EmptyPanel title="No app calls" text="No in-app call events yet." /> : null}</div>}
        {tab === 'safety' && <SafetyPanel alerts={alerts} profiles={profiles} checkins={checkins} onChanged={load} />}
      </section>
      <aside className="space-y-3">{profiles.map((profile) => { const location = locations.find((row) => row.user_id === profile.id); const stale = !location || Date.now() - new Date(location.updated_at).getTime() > 10 * 60000; return <button key={profile.id} type="button" onClick={() => setSelectedUser(profile.id)} className={`w-full rounded-2xl border p-4 text-left ${selectedUser === profile.id ? 'border-[var(--accent-1)]/50 bg-[var(--accent-1)]/10' : 'border-white/10 bg-[var(--card-bg)]'}`}><p className="font-medium text-[var(--text-primary)]">{profile.full_name || profile.email}</p><p className={`mt-1 text-xs ${stale ? 'text-amber-300' : 'text-emerald-300'}`}>{stale ? 'Location stale or offline' : `Live · ${relativeTime(location.updated_at)}`}</p><p className="mt-2 text-xs text-[var(--text-secondary)]">{location ? `Battery ${location.battery_level ?? '—'}% · ${location.is_charging ? 'Charging' : 'Not charging'} · ${location.network_type ?? 'Network unknown'}` : 'No GPS update yet'}</p></button>})}</aside>
    </div>
  </div>
}

function Timeline({ rows }: { rows: HistoryRow[] }) { return <div className="space-y-3 p-2"><h2 className="text-xl text-[var(--text-primary)]">Last seven days</h2>{rows.length ? rows.slice(0, 80).map((row) => <a key={row.id} href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-[var(--bg-2)] p-4"><div><p className="font-medium text-[var(--text-primary)]">{row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}</p><p className="mt-1 text-xs text-[var(--text-secondary)]">±{Math.round(row.accuracy ?? 0)}m</p></div><span className="text-sm text-[var(--accent-2)]">{new Date(row.captured_at).toLocaleString()}</span></a>) : <EmptyPanel title="No route history yet" text="Background tracking will add points here once the mobile app has location permission." />}</div> }
function DevicePanel({ location, profile }: { location: LocationRow | null; profile: Profile | null }) { return <div className="space-y-4 p-2"><h2 className="text-xl text-[var(--text-primary)]">{profile?.full_name || profile?.email || 'Device'} status</h2>{location ? <><Metric icon={Battery} label="Battery" value={location.battery_level === null ? 'Not reported' : `${location.battery_level}%${location.is_charging ? ' · Charging' : ''}`} /><Metric icon={Navigation} label="Network" value={location.network_type ?? 'Not reported'} /><Metric icon={Smartphone} label="Device" value={`${location.device_name ?? 'Not reported'} · app ${location.app_version ?? '—'}`} /><Metric icon={Clock3} label="Last sync" value={`${new Date(location.updated_at).toLocaleString()} · ±${Math.round(location.accuracy ?? 0)}m`} /></> : <EmptyPanel title="No device data" text="This device has not sent a location update yet." />}</div> }
function Metric({ icon: Icon, label, value }: { icon: typeof Battery; label: string; value: string }) { return <div className="flex gap-3 rounded-2xl bg-[var(--bg-2)] p-4"><Icon className="h-5 w-5 text-[var(--accent-1)]" /><div><p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">{label}</p><p className="mt-1 text-sm text-[var(--text-primary)]">{value}</p></div></div> }
function EmptyPanel({ title, text }: { title: string; text: string }) { return <div className="flex min-h-[260px] flex-col items-center justify-center p-6 text-center"><h2 className="text-xl text-[var(--text-primary)]">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{text}</p></div> }
function SafetyPanel({ alerts, profiles, checkins, onChanged }: { alerts: EmergencyAlert[]; profiles: Profile[]; checkins: SafetyCheckin[]; onChanged: () => void }) {
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
  return <div className="space-y-4 p-2"><EmergencySOS onSOS={() => onChanged()} /><div className="grid grid-cols-3 gap-3"><button type="button" onClick={() => void startCheckin('safe', 'I am safe')} className="rounded-xl bg-emerald-600 p-3 text-sm font-medium text-white">I am safe</button><button type="button" onClick={() => void startCheckin('need_help', 'I need help')} className="rounded-xl bg-red-600 p-3 text-sm font-medium text-white">I need help</button><button type="button" onClick={() => void startCheckin('home', 'I am home')} className="rounded-xl bg-blue-600 p-3 text-sm font-medium text-white">I am home</button></div>{checkins.slice(0, 5).map((checkin) => <div key={checkin.id} className="rounded-xl bg-[var(--bg-2)] p-3 text-sm text-[var(--text-secondary)]"><p className="font-medium text-[var(--text-primary)]">{checkin.checkinType.replace('_', ' ')} · {checkin.status}</p><p>{new Date(checkin.createdAt).toLocaleString()}{checkin.expectedUntil ? ` · expected by ${new Date(checkin.expectedUntil).toLocaleString()}` : ''}</p></div>)}<h2 className="text-xl text-[var(--text-primary)]">Recent SOS alerts</h2>{alerts.length ? alerts.map((alert) => <div key={alert.id} className="block rounded-2xl border border-red-400/30 bg-red-500/10 p-4"><a href={alert.latitude !== null && alert.longitude !== null ? `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}` : '#'} target="_blank" rel="noreferrer"><p className="font-medium text-red-100">🆘 {profiles.find((profile) => profile.id === alert.reporter_id)?.full_name || 'Partner'} sent an SOS</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{new Date(alert.created_at).toLocaleString()} · {alert.latitude !== null ? 'open map' : 'location unavailable'}</p></a>{alert.resolved_at ? <div className="mt-3 text-sm text-[var(--text-secondary)]"><p>Resolved by {profiles.find((profile) => profile.id === alert.resolved_by)?.full_name || 'Partner'} on {new Date(alert.resolved_at).toLocaleString()}</p>{alert.resolution_note ? <p className="mt-1">Note: {alert.resolution_note}</p> : null}</div> : <button type="button" onClick={() => void handleResolve(alert)} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Resolve</button>}</div>) : <p className="rounded-2xl bg-[var(--bg-2)] p-4 text-sm text-[var(--text-secondary)]">No SOS alerts yet.</p>}</div>
}
