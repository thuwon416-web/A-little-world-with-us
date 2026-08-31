import { useAuth } from '@/lib/auth'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  getCurrentLocation,
  shareLocation,
  startLocationTracking,
  stopLocationTracking,
  type LocationPoint,
} from '@/services/location'
import { useCallback, useEffect, useMemo, useState } from 'react'

export function getDistanceKm(from: LocationPoint, to: LocationPoint) {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusKm * c
}

export function useLocation() {
  const { user } = useAuth()
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null)
  const [partnerLocation, setPartnerLocation] = useState<LocationPoint | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const refreshCurrentLocation = useCallback(async () => {
    try {
      const nextPoint = await getCurrentLocation()
      setCurrentLocation(nextPoint)
      setLastUpdated(nextPoint.timestamp)
      setError(null)

      if (isSharing) {
        await shareLocation(nextPoint)
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to access location')
    } finally {
      setLoading(false)
    }
  }, [isSharing])

  const toggleSharing = useCallback(
    async (share: boolean) => {
      try {
        if (!share) {
          await stopLocationTracking()
          setIsSharing(false)
          return
        }

        const nextPoint = await getCurrentLocation()
        setCurrentLocation(nextPoint)
        setLastUpdated(nextPoint.timestamp)
        setIsSharing(true)
        setError(null)
        await shareLocation(nextPoint)

        await startLocationTracking((updatedPoint) => {
          setCurrentLocation(updatedPoint)
          setLastUpdated(updatedPoint.timestamp)
          setError(null)
        })
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Sharing failed')
      }
    },
    [],
  )

  useEffect(() => {
    void refreshCurrentLocation()

    const intervalId = setInterval(() => {
      void refreshCurrentLocation()
    }, 30000)

    return () => clearInterval(intervalId)
  }, [refreshCurrentLocation])

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      return
    }

    const loadPartnerLocation = async () => {
      const { data, error: partnerError } = await supabase
        .from('user_locations')
        .select('*')
        .neq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (partnerError || !data || data.length === 0) {
        setPartnerLocation(null)
        return
      }

      const partner = data[0] as {
        latitude: number
        longitude: number
        accuracy: number | null
        updated_at: string
      }

      setPartnerLocation({
        latitude: partner.latitude,
        longitude: partner.longitude,
        accuracy: partner.accuracy ?? null,
        timestamp: partner.updated_at,
      })
    }

    void loadPartnerLocation()
  }, [user?.id, currentLocation?.timestamp, isSharing])

  const distanceKm = useMemo(() => {
    if (!currentLocation || !partnerLocation) {
      return null
    }

    return getDistanceKm(currentLocation, partnerLocation)
  }, [currentLocation, partnerLocation])

  return {
    currentLocation,
    partnerLocation,
    distanceKm,
    isSharing,
    loading,
    error,
    lastUpdated,
    toggleSharing,
    refreshCurrentLocation,
  }
}
