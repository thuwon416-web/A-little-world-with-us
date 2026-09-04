'use client'

import { useState } from 'react'
import { AlertTriangle, Smartphone, MapPin, Clock } from 'lucide-react'

interface EmergencySOSProps {
  userId?: string
  onSOS?: (location: { latitude: number; longitude: number }) => void
}

export default function EmergencySOS({ onSOS }: EmergencySOSProps) {
  const [isSending, setIsSending] = useState(false)
  const [lastSOS, setLastSOS] = useState<Date | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const handleSOS = async () => {
    if (isSending) return

    setIsSending(true)

    try {
      // Get current location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const currentLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
            
            setLocation(currentLocation)
            
            // Send to parent component
            onSOS?.(currentLocation)
            
            // In production, this would send to Supabase
            // await supabase.from('emergency_alerts').insert({
            //   user_id: userId,
            //   latitude: currentLocation.latitude,
            //   longitude: currentLocation.longitude,
            //   timestamp: new Date().toISOString(),
            // })
            
            setLastSOS(new Date())
            setIsSending(false)
            
            // Send notification (in production)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🆘 Emergency SOS Sent', {
                body: 'Your location has been shared with your partner',
                icon: '/icon-192x192.png',
              })
            }
          },
          (error) => {
            console.error('Failed to get location:', error)
            setIsSending(false)
            alert('Failed to get location. Please enable location services.')
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        )
      } else {
        alert('Geolocation is not supported by your browser')
        setIsSending(false)
      }
    } catch (error) {
      console.error('SOS error:', error)
      setIsSending(false)
      alert('Failed to send SOS. Please try again.')
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  return (
    <div className="space-y-4">
      {/* SOS Button */}
      <button
        type="button"
        onClick={handleSOS}
        disabled={isSending}
        className="relative w-full overflow-hidden rounded-2xl border-2 border-red-500 bg-gradient-to-br from-red-600 to-red-700 p-6 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
      >
        <div className="flex items-center justify-center gap-3">
          {isSending ? (
            <>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span className="text-lg font-semibold">Sending...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-8 w-8 animate-pulse" />
              <span className="text-xl font-bold">🆘 EMERGENCY SOS</span>
            </>
          )}
        </div>
        <p className="mt-2 text-center text-sm text-white/80">
          One-tap emergency alert with location
        </p>
      </button>

      {/* Last SOS Info */}
      {lastSOS && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-red-500" />
            <p className="text-xs text-[var(--text-secondary)]">Last SOS sent</p>
          </div>
          <p className="text-sm text-[var(--text-primary)]">
            {lastSOS.toLocaleString()}
          </p>
        </div>
      )}

      {/* Location Info */}
      {location && (
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-[var(--accent-1)]" />
            <p className="text-xs text-[var(--text-secondary)]">Location shared</p>
          </div>
          <p className="text-sm text-[var(--text-primary)]">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
          <button
            type="button"
            onClick={() => window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank')}
            className="mt-2 text-xs text-[var(--accent-1)] hover:underline"
          >
            View on map
          </button>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">Emergency Information</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              When you tap SOS, your current location will be immediately shared with your partner. They will receive an emergency notification with your coordinates.
            </p>
          </div>
        </div>
      </div>

      {/* Request Notification Permission */}
      {('Notification' in window && Notification.permission === 'default') && (
        <button
          type="button"
          onClick={requestNotificationPermission}
          className="w-full rounded-lg border border-[var(--accent-1)]/20 px-4 py-2 text-sm text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
        >
          Enable Emergency Notifications
        </button>
      )}
    </div>
  )
}
