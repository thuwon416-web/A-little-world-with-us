import {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
} from '@maplibre/maplibre-react-native'
import Constants from 'expo-constants'
import * as Location from 'expo-location'
import { Redirect } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useAdmin } from '@/hooks/useAdmin'
import { useLocation } from '@/hooks/useLocation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { sendLocalNotification } from '@/services/notifications'
import { resolveSos } from '@/services/safety-sos'
import { createCheckin, type SafetyCheckin } from '@/services/safety-checkins'
import { useTheme } from '@/context/ThemeContext'

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
  app_version: string | null
}
type SavedPlace = { id: string; name: string; radius_meters: number }
type CallEvent = { id: string; type: string; status: string; created_at: string }
type SosAlert = {
  id: string
  message: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  resolution_note: string | null
}

const mapStyle = process.env.EXPO_PUBLIC_CARTO_STYLE_URL ?? 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const APP_VERSION = Constants.expoConfig?.version ?? 'Unknown'
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
  const { colors } = useTheme()
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
  const [checkins, setCheckins] = useState<SafetyCheckin[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [sosSending, setSosSending] = useState(false)
  const [sosSentAt, setSosSentAt] = useState<string | null>(null)
  const [sosLocation, setSosLocation] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null)
  const [sosError, setSosError] = useState('')
  const [placeModalOpen, setPlaceModalOpen] = useState(false)
  const [placeName, setPlaceName] = useState('')
  const [placeRadius, setPlaceRadius] = useState('100')
  const [placeSaving, setPlaceSaving] = useState(false)
  const [resolveModalAlert, setResolveModalAlert] = useState<SosAlert | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [checkinType, setCheckinType] = useState<SafetyCheckin['checkinType'] | null>(null)
  const [checkinNote, setCheckinNote] = useState('')
  const [checkinExpected, setCheckinExpected] = useState('')
  const [checkinSending, setCheckinSending] = useState(false)

  const sendSOS = async () => {
    if (sosSending || !user || !coupleId) return
    setSosSending(true)
    setSosError('')
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        throw new Error('Location permission is required to send an SOS.')
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const point = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
      const [alertResult, messageResult] = await Promise.all([
        supabase.from('emergency_alerts').insert({
          couple_id: coupleId,
          reporter_id: user.id,
          latitude: point.latitude,
          longitude: point.longitude,
          accuracy: point.accuracy,
        }),
        supabase.from('messages').insert({
          couple_id: coupleId,
          sender_id: user.id,
          content: 'Emergency SOS — current location shared',
          message_type: 'sos',
          location_payload: point,
        }),
      ])
      if (alertResult.error || messageResult.error) {
        throw new Error(alertResult.error?.message ?? messageResult.error?.message ?? 'SOS could not be saved.')
      }
      setSosLocation(point)
      setSosSentAt(new Date().toISOString())
      await sendLocalNotification('Emergency SOS sent', 'Your location has been shared with your partner.')
      setSosAlerts((current) => [
        {
          id: `local-${Date.now()}`,
          message: 'Emergency SOS — current location shared',
          created_at: new Date().toISOString(),
          resolved_at: null,
          resolved_by: null,
          resolution_note: null,
        },
        ...current,
      ])
    } catch (caught) {
      setSosError(caught instanceof Error ? caught.message : 'Failed to send SOS.')
    } finally {
      setSosSending(false)
    }
  }

  const confirmSOS = () => {
    Alert.alert(
      'Send emergency SOS?',
      'Your current location will be shared with your partner.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send SOS', style: 'destructive', onPress: () => void sendSOS() },
      ]
    )
  }

  const submitCheckin = async () => {
    if (!checkinType || checkinSending || !coupleId) return
    const expectedDate = checkinExpected.trim() ? new Date(checkinExpected.trim()) : null
    if (expectedDate && Number.isNaN(expectedDate.getTime())) {
      Alert.alert('Invalid expected time', 'Use a valid date and time.')
      return
    }
    setCheckinSending(true)
    try {
      const checkin = await createCheckin({
        checkinType,
        message: checkinNote.trim() || null,
        latitude: currentLocation?.latitude ?? null,
        longitude: currentLocation?.longitude ?? null,
        accuracy: currentLocation?.accuracy ?? null,
        expectedUntil: expectedDate?.toISOString() ?? null,
      })
      const { error } = await supabase.functions.invoke('checkin-notify', { body: { checkinId: checkin.id, type: checkinType } })
      if (error) throw error
      setCheckins((current) => [checkin, ...current])
      setCheckinType(null)
      setCheckinNote('')
      setCheckinExpected('')
    } catch (caught) {
      Alert.alert('Unable to send check-in', caught instanceof Error ? caught.message : 'Please try again.')
    } finally {
      setCheckinSending(false)
    }
  }

  const submitResolution = async () => {
    if (!resolveModalAlert || resolving) return
    setResolving(true)
    try {
      await resolveSos(resolveModalAlert.id, resolutionNote)
      setSosAlerts((current) => current.map((alert) => alert.id === resolveModalAlert.id
        ? { ...alert, resolved_at: new Date().toISOString(), resolution_note: resolutionNote.trim() || null }
        : alert))
      setResolveModalAlert(null)
      setResolutionNote('')
    } catch (caught) {
      Alert.alert('Unable to resolve SOS', caught instanceof Error ? caught.message : 'Please try again.')
    } finally {
      setResolving(false)
    }
  }

  const savePlace = async () => {
    if (!user || !coupleId || !placeName.trim()) return
    const radius = Number(placeRadius)
    if (!Number.isInteger(radius) || radius < 25 || radius > 10000) {
      Alert.alert('Invalid radius', 'Radius must be a whole number from 25 to 10,000 meters.')
      return
    }
    const point = currentLocation
    if (!point) {
      Alert.alert('Location unavailable', 'Refresh your device location before saving a place.')
      return
    }
    setPlaceSaving(true)
    const { data, error: saveError } = await supabase
      .from('saved_places')
      .insert({
        couple_id: coupleId,
        created_by: user.id,
        name: placeName.trim(),
        latitude: point.latitude,
        longitude: point.longitude,
        radius_meters: radius,
      })
      .select('id,name,radius_meters')
      .single()
    setPlaceSaving(false)
    if (saveError) {
      Alert.alert('Unable to save place', saveError.message)
      return
    }
    setSavedPlaces((places) => [...places, data as SavedPlace])
    setPlaceName('')
    setPlaceRadius('100')
    setPlaceModalOpen(false)
  }

  const deletePlace = (place: SavedPlace) => {
    Alert.alert('Delete saved place?', place.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void supabase.from('saved_places').delete().eq('id', place.id).then(({ error: deleteError }) => {
            if (deleteError) {
              Alert.alert('Unable to delete place', deleteError.message)
              return
            }
            setSavedPlaces((places) => places.filter((item) => item.id !== place.id))
          })
        },
      },
    ])
  }

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
        return
      }
      setCoupleId(link.couple_id)
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const [latest, route, places, callEvents, alerts, checkinRows] = await Promise.all([
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
          .select('id,message,created_at,resolved_at,resolved_by,resolution_note')
          .eq('couple_id', link.couple_id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('safety_checkins')
          .select('*')
          .eq('couple_id', link.couple_id)
          .order('created_at', { ascending: false })
          .limit(20),
      ])
      setRows((latest.data ?? []) as LocationRow[])
      setHistory((route.data ?? []) as LocationHistoryRow[])
      setSavedPlaces((places.data ?? []) as SavedPlace[])
      setCalls((callEvents.data ?? []) as CallEvent[])
      setSosAlerts((alerts.data ?? []) as SosAlert[])
      setCheckins((checkinRows.data ?? []) as SafetyCheckin[])
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

  const displayedRows = useMemo(() => {
    if (!currentLocation || !user?.id || rows.some((row) => row.user_id === user.id)) {
      return rows
    }
    return [
      {
        user_id: user.id,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        place_label: null,
        updated_at: currentLocation.timestamp,
        battery_level: null,
        is_charging: null,
        network_type: null,
        device_name: null,
        app_version: APP_VERSION,
      },
      ...rows,
    ]
  }, [currentLocation, rows, user?.id])
  const hasAnyLocation = displayedRows.length > 0 || currentLocation !== null

  const center = useMemo<[number, number]>(() => {
    const focus = displayedRows[0] ?? partnerLocation
    return focus ? [focus.longitude, focus.latitude] : DEFAULT_CENTER
  }, [displayedRows, partnerLocation])
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
            mapStyle={mapStyle}
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
            {displayedRows.map((row) => (
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
            {displayedRows.map((row) =>
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
              {hasAnyLocation ? 'Live location' : 'Waiting for GPS data'}
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
              <Text style={styles.meta}>
                App version: {APP_VERSION} · Accuracy:{' '}
                {row.user_id === user?.id
                  ? (currentLocation?.accuracy ?? row.accuracy) === null
                    ? 'Not reported'
                    : `±${Math.round(currentLocation?.accuracy ?? row.accuracy ?? 0)}m`
                  : row.accuracy === null
                    ? 'Not reported'
                    : `±${Math.round(row.accuracy)}m`}
              </Text>
            </View>
          ))}
          {!rows.length ? <Empty label="No linked device has shared a location yet." /> : null}
        </ScrollView>
      ) : activeTab === 'Saved Places' ? (
        <ScrollView contentContainerStyle={styles.list}>
          <TouchableOpacity style={styles.button} onPress={() => setPlaceModalOpen(true)}>
            <Text style={styles.buttonText}>Add place from current location</Text>
          </TouchableOpacity>
          {savedPlaces.map((place) => (
            <View key={place.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>{place.name}</Text>
              <Text style={styles.meta}>Safe zone · {place.radius_meters}m radius</Text>
              <TouchableOpacity onPress={() => deletePlace(place)}>
                <Text style={styles.danger}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!savedPlaces.length ? (
            <Empty label="No saved places yet." />
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
          <View style={styles.checkinGrid}>
            {([
              ['safe', 'I am safe', colors.success],
              ['need_help', 'I need help', colors.error],
              ['home', 'I am home', colors.accent1],
            ] as const).map(([type, label, color]) => (
              <TouchableOpacity key={type} style={[styles.checkinButton, { backgroundColor: color }]} onPress={() => setCheckinType(type)}>
                <Text style={styles.buttonText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {checkins.slice(0, 5).map((checkin) => (
            <View key={checkin.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>{checkin.checkinType.replace('_', ' ')} · {checkin.status}</Text>
              <Text style={styles.meta}>{new Date(checkin.createdAt).toLocaleString()}{checkin.expectedUntil ? ` · expected by ${new Date(checkin.expectedUntil).toLocaleString()}` : ''}</Text>
            </View>
          ))}
          <View style={[styles.sosCard, { backgroundColor: colors.cardBg, borderColor: colors.error }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Emergency SOS</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              Share your current location with your partner immediately.
            </Text>
            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: colors.error }]}
              onPress={confirmSOS}
              disabled={sosSending || !coupleId}
              accessibilityRole="button"
              accessibilityLabel="Send emergency SOS"
            >
              <Text style={styles.sosButtonText}>{sosSending ? 'Sending...' : 'EMERGENCY SOS'}</Text>
            </TouchableOpacity>
            {sosSentAt ? (
              <Text style={[styles.sosSuccess, { color: colors.success }]}>SOS sent {new Date(sosSentAt).toLocaleString()}</Text>
            ) : null}
            {sosLocation ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                Location shared: {sosLocation.latitude.toFixed(6)}, {sosLocation.longitude.toFixed(6)}
              </Text>
            ) : null}
            {sosError ? <Text style={[styles.sosError, { color: colors.error }]}>{sosError}</Text> : null}
          </View>
          {sosAlerts.map((alert) => (
            <View key={alert.id} style={styles.listItem}>
              <Text style={styles.cardTitle}>
                {alert.resolved_at ? 'Resolved SOS' : 'Active SOS'}
              </Text>
              <Text style={styles.meta}>
                {alert.message ?? 'Safety alert'} · {new Date(alert.created_at).toLocaleString()}
              </Text>
              {alert.resolved_at ? (
                <Text style={[styles.meta, { color: colors.success }]}>
                  Resolved {new Date(alert.resolved_at).toLocaleString()}
                  {alert.resolution_note ? ` · ${alert.resolution_note}` : ''}
                </Text>
              ) : (
                <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => setResolveModalAlert(alert)}>
                  <Text style={styles.buttonText}>Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {!sosAlerts.length ? (
            <Empty label="No SOS alerts. This stays empty until someone uses the in-app safety action." />
          ) : null}
        </ScrollView>
      )}
        <Modal visible={Boolean(checkinType)} transparent animationType="slide" onRequestClose={() => setCheckinType(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.cardTitle}>{checkinType === 'safe' ? 'I am safe' : checkinType === 'home' ? 'I am home' : 'I need help'}</Text>
              <TextInput style={[styles.input, styles.noteInput]} value={checkinNote} onChangeText={setCheckinNote} placeholder="Optional note" placeholderTextColor={colors.textSecondary} multiline maxLength={500} />
              <TextInput style={styles.input} value={checkinExpected} onChangeText={setCheckinExpected} placeholder="Optional expected time" placeholderTextColor={colors.textSecondary} />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setCheckinType(null)}><Text style={styles.meta}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => void submitCheckin()} disabled={checkinSending}>
                  <Text style={styles.buttonText}>{checkinSending ? 'Sending...' : 'Send check-in'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={Boolean(resolveModalAlert)} transparent animationType="slide" onRequestClose={() => setResolveModalAlert(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.cardTitle}>Resolve SOS</Text>
              <Text style={styles.meta}>Add an optional note for the person who sent the alert.</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={resolutionNote}
                onChangeText={setResolutionNote}
                placeholder="Resolution note"
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setResolveModalAlert(null)}><Text style={styles.meta}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => void submitResolution()} disabled={resolving}>
                  <Text style={styles.buttonText}>{resolving ? 'Resolving...' : 'Resolve SOS'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={placeModalOpen} transparent animationType="slide" onRequestClose={() => setPlaceModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Add saved place</Text>
            <TextInput style={styles.input} value={placeName} onChangeText={setPlaceName} placeholder="Name" placeholderTextColor={colors.textSecondary} />
            <TextInput style={styles.input} value={placeRadius} onChangeText={setPlaceRadius} placeholder="Radius in meters" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
            <Text style={styles.meta}>
              {currentLocation ? `Using current location: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}` : 'Current location unavailable'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPlaceModalOpen(false)}><Text style={styles.meta}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => void savePlace()} disabled={placeSaving}>
                <Text style={styles.buttonText}>{placeSaving ? 'Saving...' : 'Save place'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  checkinGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  checkinButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  buttonText: { color: '#260f2d', fontWeight: '800' },
  danger: { color: '#fca5a5', fontWeight: '700', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#5d416f',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff7fb',
    marginTop: 10,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalCard: {
    backgroundColor: '#2b1745',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  loading: { color: '#d4bdd1', textAlign: 'center', marginTop: 8, fontSize: 12 },
  sosCard: {
    backgroundColor: '#32111d',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  sosButton: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sosButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sosSuccess: { color: '#86efac', fontSize: 12 },
  sosError: { color: '#fca5a5', fontSize: 12 },
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
