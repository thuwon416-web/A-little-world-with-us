import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Battery from 'expo-battery'
import * as Device from 'expo-device'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import NetInfo from '@react-native-community/netinfo'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type LocationPoint = { latitude: number; longitude: number; accuracy: number | null; timestamp: string }
type DeviceStatus = { battery_level: number | null; is_charging: boolean | null; network_type: string | null; device_name: string | null; app_version: string | null }
type QueuedPoint = LocationPoint

const TASK_NAME = 'pair-background-location'
const OFFLINE_QUEUE_KEY = 'location-offline-queue'
let foregroundSubscription: Location.LocationSubscription | null = null
let lastSharedAt = 0

async function getDeviceStatus(): Promise<DeviceStatus> {
  const [batteryLevel, batteryState, network] = await Promise.all([Battery.getBatteryLevelAsync(), Battery.getBatteryStateAsync(), NetInfo.fetch()])
  return { battery_level: batteryLevel >= 0 ? Math.round(batteryLevel * 100) : null, is_charging: batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL, network_type: network.type ?? null, device_name: Device.deviceName ?? Device.modelName ?? null, app_version: Device.osVersion ?? null }
}

async function queuePoint(point: LocationPoint) {
  const current = JSON.parse((await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)) ?? '[]') as QueuedPoint[]
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...current.slice(-99), point]))
}

async function flushQueue() {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
  if (!raw) return
  const queued = JSON.parse(raw) as QueuedPoint[]
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY)
  for (const point of queued) {
    if (!(await shareLocation(point, false))) { await queuePoint(point); break }
  }
}

export async function getActiveCoupleId(userId: string): Promise<string | null> {
  const { data } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`).eq('status', 'accepted').not('couple_id', 'is', null).maybeSingle()
  return data?.couple_id ?? null
}

export async function getCurrentLocation(): Promise<LocationPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') throw new Error('Location permission denied')
  const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy ?? null, timestamp: new Date(location.timestamp).toISOString() }
}

async function shouldShare(point: LocationPoint) {
  const now = Date.now()
  const elapsed = now - lastSharedAt
  const moving = (point.accuracy ?? 999) < 100
  if (elapsed < (moving ? 30_000 : 5 * 60_000)) return false
  lastSharedAt = now
  return true
}

export async function startLocationTracking(onUpdate?: (point: LocationPoint) => void): Promise<Location.LocationSubscription | null> {
  const foreground = await Location.requestForegroundPermissionsAsync()
  if (foreground.status !== 'granted') throw new Error('Location permission denied')
  const background = await Location.requestBackgroundPermissionsAsync()
  if (background.status !== 'granted') throw new Error('Background location permission denied')
  if (foregroundSubscription) foregroundSubscription.remove()
  foregroundSubscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 30_000, distanceInterval: 30 }, (location) => {
    const point = { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy ?? null, timestamp: new Date(location.timestamp).toISOString() }
    onUpdate?.(point)
    void shareLocation(point)
  })
  const active = await Location.hasStartedLocationUpdatesAsync(TASK_NAME)
  if (!active) await Location.startLocationUpdatesAsync(TASK_NAME, { accuracy: Location.Accuracy.Balanced, timeInterval: 30_000, distanceInterval: 30, foregroundService: { notificationTitle: 'Location sharing is active', notificationBody: 'Updating your linked safety map.' }, pausesUpdatesAutomatically: true, showsBackgroundLocationIndicator: true })
  await flushQueue()
  return foregroundSubscription
}

export async function stopLocationTracking() {
  foregroundSubscription?.remove(); foregroundSubscription = null
  if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) await Location.stopLocationUpdatesAsync(TASK_NAME)
}

export async function shareLocation(point?: LocationPoint, respectCadence = true): Promise<boolean> {
  if (!isSupabaseConfigured || !point) return false
  if (respectCadence && !(await shouldShare(point))) return true
  const network = await NetInfo.fetch()
  if (!network.isConnected) { await queuePoint(point); return false }
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return false
  const coupleId = await getActiveCoupleId(user.id)
  if (!coupleId) return false
  const status = await getDeviceStatus()
  const { error } = await supabase.from('user_locations').upsert({ user_id: user.id, couple_id: coupleId, latitude: point.latitude, longitude: point.longitude, accuracy: point.accuracy ?? 0, updated_at: point.timestamp, ...status }, { onConflict: 'user_id' })
  if (error) { await queuePoint(point); return false }
  const { error: historyError } = await supabase.from('location_history').insert({ user_id: user.id, couple_id: coupleId, latitude: point.latitude, longitude: point.longitude, accuracy: point.accuracy, captured_at: point.timestamp })
  if (historyError) return false
  await flushQueue()
  return true
}

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error || !data) return
  const { locations } = data as { locations: Location.LocationObject[] }
  const current = locations.at(-1)
  if (!current) return
  await shareLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude, accuracy: current.coords.accuracy ?? null, timestamp: new Date(current.timestamp).toISOString() })
})
