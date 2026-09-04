'use client'

import { useState } from 'react'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'

interface Location {
  latitude: number
  longitude: number
}

interface LiveLocationMapProps {
  adminLocation: Location | null
  userLocation: Location | null
  userName?: string
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(loc2.latitude - loc1.latitude)
  const dLon = toRad(loc2.longitude - loc1.longitude)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.latitude)) *
      Math.cos(toRad(loc2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Calculate midpoint between two locations
function calculateMidpoint(loc1: Location, loc2: Location): Location {
  return {
    latitude: (loc1.latitude + loc2.latitude) / 2,
    longitude: (loc1.longitude + loc2.longitude) / 2,
  }
}

export default function LiveLocationMap({ adminLocation, userLocation, userName }: LiveLocationMapProps) {
  const [showMidpoint, setShowMidpoint] = useState(false)
  
  const distance = adminLocation && userLocation ? calculateDistance(adminLocation, userLocation) : 0
  const midpoint = adminLocation && userLocation ? calculateMidpoint(adminLocation, userLocation) : null

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  const openNavigation = () => {
    if (midpoint) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${midpoint.latitude},${midpoint.longitude}`, '_blank')
    }
  }

  return (
    <div className="space-y-4">
      {/* Distance Display */}
      {adminLocation && userLocation && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Distance apart</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{distance.toFixed(2)} km</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMidpoint(!showMidpoint)}
            className="rounded-lg border border-[var(--accent-1)]/20 px-3 py-2 text-sm text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
          >
            {showMidpoint ? 'Hide' : 'Meet Here'}
          </button>
        </div>
      )}

      {/* Midpoint Display */}
      {showMidpoint && midpoint && (
        <div className="rounded-xl border border-[var(--accent-2)]/20 bg-[var(--accent-2)]/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-[var(--accent-2)]/15 p-2 text-[var(--accent-2)]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Meet in the middle</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {midpoint.latitude.toFixed(6)}, {midpoint.longitude.toFixed(6)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNavigation}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent-2)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
          >
            <Navigation className="h-4 w-4" />
            Navigate There
          </button>
        </div>
      )}

      {/* Map Placeholder with Markers */}
      <div className="relative h-[400px] overflow-hidden rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,107,157,0.15),_rgba(0,0,0,0)_48%),linear-gradient(135deg,_#21162e,_#15263d_55%,_#201437)]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Admin Marker */}
        {adminLocation && (
          <div
            className="absolute cursor-pointer"
            style={{
              left: `${50}%`,
              top: `${30}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => openGoogleMaps(adminLocation.latitude, adminLocation.longitude)}
          >
            <div className="relative group">
              <div className="h-4 w-4 rounded-full border-4 border-blue-500 bg-white shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-[var(--card-bg-strong)] px-2 py-1 text-xs text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition">
                You (Admin)
              </div>
            </div>
          </div>
        )}

        {/* User Marker */}
        {userLocation && (
          <div
            className="absolute cursor-pointer"
            style={{
              left: `${50}%`,
              top: `${70}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => openGoogleMaps(userLocation.latitude, userLocation.longitude)}
          >
            <div className="relative group">
              <div className="h-4 w-4 rounded-full border-4 border-[var(--accent-1)] bg-white shadow-[0_0_15px_rgba(255,107,157,0.8)]" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-[var(--card-bg-strong)] px-2 py-1 text-xs text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition">
                {userName || 'Partner'}
              </div>
            </div>
          </div>
        )}

        {/* Midpoint Marker */}
        {showMidpoint && midpoint && (
          <div
            className="absolute cursor-pointer"
            style={{
              left: `${50}%`,
              top: `${50}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => openGoogleMaps(midpoint.latitude, midpoint.longitude)}
          >
            <div className="relative group">
              <div className="h-3 w-3 rounded-full border-4 border-[var(--accent-2)] bg-white shadow-[0_0_15px_rgba(255,182,193,0.8)]" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-[var(--accent-2)]/20 px-2 py-1 text-xs text-[var(--accent-2)] opacity-0 group-hover:opacity-100 transition">
                Meet Here
              </div>
            </div>
          </div>
        )}

        {/* Open in Google Maps button */}
        <div className="absolute bottom-4 right-4">
          <button
            type="button"
            onClick={() => {
              if (userLocation) {
                openGoogleMaps(userLocation.latitude, userLocation.longitude)
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-[var(--card-bg-strong)]/80 px-3 py-2 text-xs text-[var(--text-primary)] backdrop-blur-xl transition hover:bg-[var(--card-bg-strong)]"
          >
            <ExternalLink className="h-3 w-3" />
            Open in Maps
          </button>
        </div>
      </div>
    </div>
  )
}
