import {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
} from '@maplibre/maplibre-react-native'
import { Redirect } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useAdmin } from '@/hooks/useAdmin'
import { useLocation } from '@/hooks/useLocation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type LocationHistoryRow = {
  latitude: number
  longitude: number
  captured_at: string
  place_label: string | null
}
type LocationRow = {
  user_id: string
  latitude: number
  longitude: number
  accuracy: number | null
  place_label: string | null
  updated_at: string
  battery_level: number | null
  is_charging: boolean | null
  network_type: string | null
  device_name: string | null
}
type SavedPlace = { id: string; name: string; radius_meters: number }
type CallEvent = { id: string; type: string; status: string; created_at: string }
type SosAlert = {
  id: string
  message: string | null
  created_at: string
  resolved_at: string | null
}

const CARTO_DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]
const tabs = [
  'Live Map',
  'Timeline',
  'Saved Places',
  'Device Status',
  'App Calls',
  'Safety/SOS',
] as const
type Tab = (typeof tabs)[number]

export default function LocationScreen() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const { user } = useAuth()
  const {
    currentLocation,
    partnerLocation,
    distanceKm,
    loading,
    error,
    lastUpdated,
    refreshCurrentLocation,
  } = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>('Live Map')
  const [rows, setRows] = useState<LocationRow[]>([])
  const [history, setHistory] = useState<LocationHistoryRow[]>([])
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [calls, setCalls] = useState<CallEvent[]>([])
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading')

  useEffect(() => {
    if (!isAdmin || !user) return
    const load = async () => {
      const { data: link } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .not('couple_id', 'is', null)
        .maybeSingle()
      if (!link?.couple_id) {
        setStatus('empty')
        return
      }
      setCoupleId(link.couple_id)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const [latest, route, places, callEvents, alerts] = await Promise.all([
        supabase
          .from('user_locations')
          .select('*')
          .eq('couple_id', link.couple_id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('location_history')
          .select('latitude,longitude,captured_at,place_label')
          .eq('couple_id', link.couple_id)
          .gte('captured_at', since)
          .order('captured_at'),
        supabase
          .from('saved_places')
          .select('id,name,radius_meters')
          .eq('couple_id', link.couple_id)
          .order('created_at'),
        supabase
          .from('call_signals')
          .select('id,type,status,created_at')
          .eq('couple_id', link.couple_id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('emergency_alerts')
          .select('id,message,created_at,resolved_at')
          .eq('couple_id', link.couple_id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      setRows((latest.data ?? []) as LocationRow[])
      setHistory((route.data ?? []) as LocationHistoryRow[])
      setSavedPlaces((places.data ?? []) as SavedPlace[])
      setCalls((callEvents.data ?? []) as CallEvent[])
      setSosAlerts((alerts.data ?? []) as SosAlert[])
      setStatus(latest.data?.length ? 'ready' : 'empty')
    }
    void load()
  }, [isAdmin, user])

  useEffect(() => {
    if (!isAdmin || !coupleId) return
    const channel = supabase
      .channel(`admin-location-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          const next = payload.new as LocationRow
          setRows((current) => [next, ...current.filter((row) => row.user_id !== next.user_id)])
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, isAdmin])

  const center = useMemo<[number, number]>(() => {
    const focus = rows[0] ?? currentLocation ?? partnerLocation
    return focus ? [focus.longitude, focus.latitude] : DEFAULT_CENTER
  }, [currentLocation, partnerLocation, rows])
  const routeShape = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: history.map((point) => [point.longitude, point.latitude]),
      },
    }),
    [history]
  )

  if (adminLoading) return null
  if (!isAdmin) return <Redirect href="/(tabs)" />

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Admin safety map</Text>
      <Text style={styles.title}>Location</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'Live Map' ? (
        <>
          <MapView
            style={styles.map}
            mapStyle={CARTO_DARK_STYLE}
            logoEnabled={false}
            attributionEnabled
          >
            <Camera
              centerCoordinate={center}
              zoomLevel={12}
              animationDuration={450}
              animationMode="easeTo"
            />
            {history.length > 1 ? (
              <ShapeSource id="seven-day-route" shape={routeShape}>
                <LineLayer
                  id="route-line"
                  style={{ lineColor: '#ff6b9d', lineWidth: 4, lineOpacity: 0.82 }}
                />
              </ShapeSource>
            ) : null}
            {rows.map((row) => (
              <PointAnnotation
                id={row.user_id}
                key={row.user_id}
                coordinate={[row.longitude, row.latitude]}
              >
                <View style={styles.marker}>
                  <Text style={styles.markerText}>{row.user_id === user?.id ? 'You' : 'P'}</Text>
                </View>
              </PointAnnotation>
            ))}
            {rows.map((row) =>
              row.accuracy ? (
                <ShapeSource
                  key={`${row.user_id}-accuracy`}
                  id={`${row.user_id}-accuracy`}
                  shape={{
                    type: 'Feature',
                    properties: {},
                    geometry: { type: 'Point', coordinates: [row.longitude, row.latitude] },
                  }}
                >
                  <CircleLayer
                    id={`${row.user_id}-accuracy-circle`}
                    style={{
                      circleRadius: Math.min(Math.max(row.accuracy / 2, 10), 50),
                      circleColor: '#ff6b9d',
                      circleOpacity: 0.15,
                    }}
                  />
                </ShapeSource>
              ) : null
            )}
          </MapView>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {status === 'ready' ? 'Live pair location' : 'Waiting for GPS data'}
            </Text>
            <Text style={styles.meta}>
              {error ??
                (lastUpdated
                  ? `Your last device sync: ${new Date(lastUpdated).toLocaleString()}`
                  : 'Each person must enable sharing in Settings > Privacy.')}
            </Text>
            {distanceKm !== null ? (
              <Text style={styles.distance}>{distanceKm.toFixed(1)} km apart</Text>
            ) : null}
            <TouchableOpacity style={styles.button} onPress={() => void refreshCurrentLocation()}>
              <Text style={styles.buttonText}>Refresh my device</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : activeTab === 'Timeline' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {history
            .slice()
            .reverse()
            .slice(0, 50)
            .map((entry) => (
              <View key={`${entry.captured_at}-${entry.latitude}`} style={styles.listItem}>
                <Text style={styles.cardTitle}>{entry.place_label ?? 'Location update'}</Text>
                <Text style={styles.meta}>{new Date(entry.captured_at).toLocaleString()}</Text>
              </View>
            ))}
          {!history.length ? <Empty label="No location history in the last seven days." /> : null}
        </ScrollView>
      ) : activeTab === 'Device Status' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {rows.map((row) => (
            <View key={row.user_id} style={styles.listItem}>
              <Text style={styles.cardTitle}>
                {row.user_id === user?.id ? 'Your device' : 'Partner device'}
              </Text>
              <Text style={styles.meta}>
                {row.place_label ?? 'Address pending'} · {row.device_name ?? 'Unknown device'} ·{' '}
                {row.battery_level ?? '—'}% · {row.is_charging ? 'charging' : 'not charging'} ·{' '}
                {row.network_type ?? 'offline'} · {new Date(row.updated_at).toLocaleString()}
              </Text>
            </View>
          ))}
          {!rows.length ? <Empty label="No linked device has shared a location yet." /> : null}
        </ScrollView>
      ) : activeTab === 'Saved Places' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {savedPlaces.map((place) => (
            <View key={place.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>{place.name}</Text>
              <Text style={styles.meta}>Safe zone · {place.radius_meters}m radius</Text>
            </View>
          ))}
          {!savedPlaces.length ? (
            <Empty label="No saved places yet. Add Home or another safe zone from the web map." />
          ) : null}
        </ScrollView>
      ) : activeTab === 'App Calls' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {calls.map((call) => (
            <View key={call.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>
                {call.type === 'video' ? 'Video call' : 'Audio call'} · {call.status}
              </Text>
              <Text style={styles.meta}>{new Date(call.created_at).toLocaleString()}</Text>
            </View>
          ))}
          {!calls.length ? (
            <Empty label="No in-app call events yet. Phone and Telegram call logs are never collected." />
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {sosAlerts.map((alert) => (
            <View key={alert.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>
                {alert.resolved_at ? 'Resolved SOS' : 'Active SOS'}
              </Text>
              <Text style={styles.meta}>
                {alert.message ?? 'Safety alert'} · {new Date(alert.created_at).toLocaleString()}
              </Text>
            </View>
          ))}
          {!sosAlerts.length ? (
            <Empty label="No SOS alerts. This stays empty until someone uses the in-app safety action." />
          ) : null}
        </ScrollView>
      )}
      {loading ? <Text style={styles.loading}>Checking device location…</Text> : null}
    </View>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.meta}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  eyebrow: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: { color: '#fff7fb', fontSize: 31, fontWeight: '700', marginTop: 5, marginBottom: 12 },
  tabs: { gap: 8, paddingBottom: 12 },
  tab: {
    borderWidth: 1,
    borderColor: '#5d416f',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: '#ff6b9d', borderColor: '#ff6b9d' },
  tabText: { color: '#e9d8e5', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#260f2d' },
  map: {
    height: 340,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#765080',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b9d',
    borderWidth: 3,
    borderColor: '#fff7fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { color: '#260f2d', fontWeight: '800', fontSize: 12 },
  card: {
    backgroundColor: '#2b1745',
    borderWidth: 1,
    borderColor: '#5d416f',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
  },
  cardTitle: { color: '#fff7fb', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  meta: { color: '#d4bdd1', fontSize: 13, lineHeight: 19 },
  distance: { color: '#ffd700', marginTop: 10, fontWeight: '700' },
  button: {
    marginTop: 14,
    backgroundColor: '#ff6b9d',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#260f2d', fontWeight: '800' },
  loading: { color: '#d4bdd1', textAlign: 'center', marginTop: 8, fontSize: 12 },
  list: { paddingBottom: 20 },
  listItem: {
    backgroundColor: '#2b1745',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#5d416f',
  },
})
