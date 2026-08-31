import * as Location from 'expo-location'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type LocationPoint = {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: string
}

let subscription: Location.LocationSubscription | null = null

export async function getCurrentLocation(): Promise<LocationPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Location permission denied')
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? null,
    timestamp: new Date(location.timestamp).toISOString(),
  }
}

export async function startLocationTracking(
  onUpdate?: (point: LocationPoint) => void,
): Promise<Location.LocationSubscription | null> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Location permission denied')
  }

  await Location.requestBackgroundPermissionsAsync().catch(() => undefined)

  if (subscription) {
    subscription.remove()
  }

  subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,
      distanceInterval: 30,
    },
    (location) => {
      const nextPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? null,
        timestamp: new Date(location.timestamp).toISOString(),
      }

      onUpdate?.(nextPoint)
      void shareLocation(nextPoint)
    },
  )

  return subscription
}

export async function stopLocationTracking(): Promise<void> {
  if (subscription) {
    subscription.remove()
    subscription = null
  }
}

export async function shareLocation(point?: LocationPoint): Promise<boolean> {
  if (!isSupabaseConfigured || !point) {
    return false
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return false
  }

  const { error } = await supabase.from('user_locations').upsert(
    {
      user_id: user.id,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy ?? 0,
      updated_at: point.timestamp,
    },
    { onConflict: 'user_id' },
  )

  return !error
}
