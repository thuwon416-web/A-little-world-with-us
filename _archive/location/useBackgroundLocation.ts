// src/hooks/useBackgroundLocation.ts
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: number
}

interface UseBackgroundLocationOptions {
  enabled?: boolean
  interval?: number // milliseconds, default 30000 (30 seconds)
  onError?: (error: Error) => void
}

export function useBackgroundLocation({
  enabled = true,
  interval = 30000,
  onError,
}: UseBackgroundLocationOptions = {}) {
  const [isTracking, setIsTracking] = useState(false)
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const saveLocationToDatabase = async (location: LocationData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('locations')
        .insert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(location.timestamp).toISOString(),
          accuracy: location.accuracy,
        })

      if (error) {
        throw error
      }

      setLastLocation(location)
    } catch (error) {
      console.error('Failed to save location:', error)
      onError?.(error as Error)
    }
  }

  const startTracking = async () => {
    if (!navigator.geolocation) {
      const error = new Error('Geolocation is not supported by this browser')
      onError?.(error)
      return
    }

    // Check for location permission
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        if (permission.state === 'denied') {
          const error = new Error('Location permission denied')
          onError?.(error)
          return
        }
      } catch (error) {
        console.warn('Could not check location permission:', error)
      }
    }

    setIsTracking(true)

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        saveLocationToDatabase(location)
      },
      (error) => {
        console.error('Geolocation error:', error)
        onError?.(new Error(error.message))
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Set up interval for periodic updates
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          saveLocationToDatabase(location)
        },
        (error) => {
          console.error('Geolocation error:', error)
          onError?.(new Error(error.message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    }, interval)
  }

  const stopTracking = () => {
    setIsTracking(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  useEffect(() => {
    if (enabled) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => {
      stopTracking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval])

  return {
    isTracking,
    lastLocation,
    startTracking,
    stopTracking,
  }
}
