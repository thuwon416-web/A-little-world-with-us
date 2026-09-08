import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import * as Battery from 'expo-battery'
import * as Device from 'expo-device'
import * as Location from 'expo-location'
import * as SecureStore from 'expo-secure-store'
import * as TaskManager from 'expo-task-manager'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type LocationPoint = {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: string
  speed?: number | null
}

export type SharingStatus = {
  enabled: boolean
  lastSyncAt: string | null
  permission: 'unknown' | 'granted' | 'denied'
  offlineQueueSize: number
}

type DeviceStatus = {
  battery_level: number | null
  is_charging: boolean | null
  network_type: string | null
  device_name: string | null
  app_version: string | null
  last_sync_at: string
}

const TASK_NAME = 'pair-background-location'
const SHARING_KEY = 'location-sharing-enabled'
const STATUS_KEY = 'location-sharing-status'
const QUEUE_KEY = 'location-offline-queue-v2'
const GEOCODE_POINT_KEY = 'location-last-geocode-point'
const MAX_QUEUE_POINTS = 20
const MOVING_INTERVAL_MS = 30_000
const STATIONARY_INTERVAL_MS = 5 * 60_000
const MOVING_DISTANCE_METERS = 30
const STATIONARY_SPEED_MPS = 0.8

let foregroundSubscription: Location.LocationSubscription | null = null
let lastSharedAt = 0
let lastPoint: LocationPoint | null = null

function distanceMeters(from: LocationPoint, to: LocationPoint) {
  const radius = 6_371_000
  const radians = (value: number) => (value * Math.PI) / 180
  const deltaLatitude = radians(to.latitude - from.latitude)
  const deltaLongitude = radians(to.longitude - from.longitude)
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(deltaLongitude / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function getDeviceStatus(): Promise<DeviceStatus> {
  const [batteryLevel, batteryState, network] = await Promise.all([
    Battery.getBatteryLevelAsync(),
    Battery.getBatteryStateAsync(),
    NetInfo.fetch(),
  ])
  return {
    battery_level: batteryLevel >= 0 ? Math.round(batteryLevel * 100) : null,
    is_charging:
      batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL,
    network_type: network.type ?? null,
    device_name: Device.deviceName ?? Device.modelName ?? null,
    app_version: Device.osVersion ?? null,
    last_sync_at: new Date().toISOString(),
  }
}

async function readQueue(): Promise<LocationPoint[]> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(QUEUE_KEY)) ?? '[]') as LocationPoint[]
  } catch {
    return []
  }
}

async function writeQueue(points: LocationPoint[]) {
  // SecureStore uses the platform Keychain / encrypted SharedPreferences.
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(points.slice(-MAX_QUEUE_POINTS)))
}

async function queuePoint(point: LocationPoint) {
  await writeQueue([...(await readQueue()), point])
}

async function flushQueue() {
  const queued = await readQueue()
  if (!queued.length) return
  await writeQueue([])
  for (let index = 0; index < queued.length; index += 1) {
    if (!(await shareLocation(queued[index], false))) {
      await writeQueue(queued.slice(index))
      return
    }
  }
}

async function refreshPlaceLabel(point: LocationPoint) {
  try {
    const previousRaw = await AsyncStorage.getItem(GEOCODE_POINT_KEY)
    const previous = previousRaw ? (JSON.parse(previousRaw) as LocationPoint) : null
    if (previous && distanceMeters(previous, point) < 200) return
    const { error } = await supabase.functions.invoke('reverse-geocode', {
      body: { latitude: point.latitude, longitude: point.longitude },
    })
    if (!error) await AsyncStorage.setItem(GEOCODE_POINT_KEY, JSON.stringify(point))
  } catch {
    // Location delivery must continue when an optional address label cannot be resolved.
  }
}

async function saveStatus(status: Partial<SharingStatus>) {
  const current = await getSharingStatus()
  await AsyncStorage.setItem(STATUS_KEY, JSON.stringify({ ...current, ...status }))
}

export async function getSharingStatus(): Promise<SharingStatus> {
  try {
    const raw = await AsyncStorage.getItem(STATUS_KEY)
    const saved = raw ? (JSON.parse(raw) as Partial<SharingStatus>) : {}
    const foreground = await Location.getForegroundPermissionsAsync()
    const queue = await readQueue()
    return {
      enabled: saved.enabled ?? (await AsyncStorage.getItem(SHARING_KEY)) === 'true',
      lastSyncAt: saved.lastSyncAt ?? null,
      permission:
        foreground.status === 'granted'
          ? 'granted'
          : foreground.status === 'denied'
            ? 'denied'
            : 'unknown',
      offlineQueueSize: queue.length,
    }
  } catch {
    return { enabled: false, lastSyncAt: null, permission: 'unknown', offlineQueueSize: 0 }
  }
}

export async function getActiveCoupleId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .eq('status', 'accepted')
    .not('couple_id', 'is', null)
    .maybeSingle()
  return data?.couple_id ?? null
}

export async function getCurrentLocation(): Promise<LocationPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted')
    throw new Error('Location permission denied. Enable precise location in Settings.')
  return toLocationPoint(
    await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  )
}

function toLocationPoint(location: Location.LocationObject): LocationPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
    speed: location.coords.speed ?? null,
    timestamp: new Date(location.timestamp).toISOString(),
  }
}

function shouldShare(point: LocationPoint) {
  const now = Date.now()
  const distance = lastPoint ? distanceMeters(lastPoint, point) : Infinity
  const moving = (point.speed ?? 0) >= STATIONARY_SPEED_MPS || distance >= MOVING_DISTANCE_METERS
  const requiredInterval = moving ? MOVING_INTERVAL_MS : STATIONARY_INTERVAL_MS
  if (now - lastSharedAt < requiredInterval && distance < MOVING_DISTANCE_METERS) return false
  lastSharedAt = now
  lastPoint = point
  return true
}

async function requireBackgroundPermission() {
  const foreground = await Location.requestForegroundPermissionsAsync()
  if (foreground.status !== 'granted')
    throw new Error('Location permission denied. Enable precise location first.')
  const background = await Location.requestBackgroundPermissionsAsync()
  if (background.status !== 'granted') {
    throw new Error(
      'Background location permission is required for sharing while the app is closed.'
    )
  }
}

export async function startLocationTracking(onUpdate?: (point: LocationPoint) => void) {
  await requireBackgroundPermission()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { error } = await supabase.from('location_sharing_settings').upsert(
      {
        user_id: user.id,
        enabled: true,
        last_permission_state: 'granted',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error)
      throw new Error(
        'Could not save your location-sharing consent. Run the latest Supabase bootstrap first.'
      )
  }
  await AsyncStorage.setItem(SHARING_KEY, 'true')
  await saveStatus({ enabled: true, permission: 'granted' })
  foregroundSubscription?.remove()
  foregroundSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: MOVING_INTERVAL_MS,
      distanceInterval: MOVING_DISTANCE_METERS,
    },
    (location) => {
      const point = toLocationPoint(location)
      onUpdate?.(point)
      void shareLocation(point)
    }
  )
  if (!(await Location.hasStartedLocationUpdatesAsync(TASK_NAME))) {
    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: MOVING_INTERVAL_MS,
      distanceInterval: MOVING_DISTANCE_METERS,
      deferredUpdatesInterval: STATIONARY_INTERVAL_MS,
      deferredUpdatesDistance: MOVING_DISTANCE_METERS,
      activityType: Location.ActivityType.Other,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Location sharing is active',
        notificationBody: 'Your partner safety map is receiving updates. Tap Settings to stop.',
      },
    })
  }
  await flushQueue()
}

export async function stopLocationTracking() {
  foregroundSubscription?.remove()
  foregroundSubscription = null
  if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(TASK_NAME)
  }
  await SecureStore.deleteItemAsync(QUEUE_KEY)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('location_sharing_settings').upsert(
      {
        user_id: user.id,
        enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }
  await AsyncStorage.setItem(SHARING_KEY, 'false')
  await saveStatus({ enabled: false })
}

export async function shareLocation(
  point?: LocationPoint,
  respectCadence = true
): Promise<boolean> {
  if (!isSupabaseConfigured || !point) return false
  if ((await AsyncStorage.getItem(SHARING_KEY)) !== 'true') return false
  if (respectCadence && !shouldShare(point)) return true
  if (!(await NetInfo.fetch()).isConnected) {
    await queuePoint(point)
    return false
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const coupleId = await getActiveCoupleId(user.id)
  if (!coupleId) return false
  const status = await getDeviceStatus()
  const { error } = await supabase.from('user_locations').upsert(
    {
      user_id: user.id,
      couple_id: coupleId,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy ?? 0,
      updated_at: point.timestamp,
      ...status,
    },
    { onConflict: 'user_id' }
  )
  if (error) {
    await queuePoint(point)
    return false
  }
  const { error: historyError } = await supabase.from('location_history').insert({
    user_id: user.id,
    couple_id: coupleId,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy,
    captured_at: point.timestamp,
  })
  if (historyError) return false
  await saveStatus({ lastSyncAt: new Date().toISOString(), enabled: true })
  void refreshPlaceLabel(point)
  return true
}

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error || !data) return
  const { locations } = data as { locations: Location.LocationObject[] }
  const current = locations.at(-1)
  if (current) await shareLocation(toLocationPoint(current))
})
