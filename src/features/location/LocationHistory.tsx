'use client'

import { useState } from 'react'
import { MapPin, Clock, Car, Bike, Footprints, Calendar } from 'lucide-react'

interface Location {
  id: string
  user_id: string
  latitude: number
  longitude: number
  timestamp: string
  accuracy: number | null
}

interface LocationHistoryProps {
  locations: Location[]
  userId: string
}

// Detect travel mode based on distance and time between locations
function detectTravelMode(prevLoc: Location, currLoc: Location): string {
  const prevTime = new Date(prevLoc.timestamp).getTime()
  const currTime = new Date(currLoc.timestamp).getTime()
  const timeDiff = (currTime - prevTime) / 1000 // seconds
  
  const distance = calculateDistance(prevLoc, currLoc) // km
  const speed = distance / (timeDiff / 3600) // km/h
  
  if (speed > 50) return 'car'
  if (speed > 15) return 'bike'
  if (speed > 5) return 'walk'
  return 'stationary'
}

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

// Group locations by date
function groupByDate(locations: Location[]): Record<string, Location[]> {
  return locations.reduce((acc, loc) => {
    const date = new Date(loc.timestamp).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(loc)
    return acc
  }, {} as Record<string, Location[]>)
}

export default function LocationHistory({ locations }: LocationHistoryProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  const groupedLocations = groupByDate(locations)
  const dates = Object.keys(groupedLocations).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  const selectedLocations = selectedDate ? groupedLocations[selectedDate] : []
  
  const getTravelIcon = (mode: string) => {
    switch (mode) {
      case 'car':
        return <Car className="h-4 w-4" />
      case 'bike':
        return <Bike className="h-4 w-4" />
      case 'walk':
        return <Footprints className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-[var(--text-secondary)]">Select date</p>
          <select
            value={selectedDate || ''}
            onChange={(e) => setSelectedDate(e.target.value || null)}
            className="mt-1 w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All dates</option>
            {dates.map((date) => (
              <option key={date} value={date}>
                {date} ({groupedLocations[date].length} locations)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {(selectedDate ? selectedLocations : locations.slice(0, 50)).map((location, index) => {
          const prevLocation = index > 0 ? (selectedDate ? selectedLocations[index - 1] : locations[index - 1]) : null
          const travelMode = prevLocation ? detectTravelMode(prevLocation, location) : 'stationary'
          
          return (
            <div
              key={location.id}
              className="flex gap-3 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4"
            >
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="h-3 w-3 rounded-full border-2 border-[var(--accent-1)] bg-[var(--accent-1)]" />
                  {index < (selectedDate ? selectedLocations.length : locations.length) - 1 && (
                    <div className="absolute left-1/2 top-3 h-8 w-0.5 -translate-x-1/2 bg-[var(--accent-1)]/30" />
                  )}
                </div>
              </div>

              {/* Location details */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-[var(--text-secondary)]" />
                    <p className="text-sm text-[var(--text-primary)]">
                      {new Date(location.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--accent-1)]">
                    {getTravelIcon(travelMode)}
                    <span className="capitalize">{travelMode}</span>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </span>
                </div>
                
                {location.accuracy && (
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">
                    Accuracy: ±{location.accuracy.toFixed(0)}m
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-center">
          <p className="text-lg font-semibold text-[var(--accent-1)]">{locations.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Total points</p>
        </div>
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-center">
          <p className="text-lg font-semibold text-[var(--accent-1)]">{dates.length}</p>
          <p className="text-xs text-[var(--text-secondary)]">Days tracked</p>
        </div>
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-center">
          <p className="text-lg font-semibold text-[var(--accent-1)]">
            {selectedDate ? selectedLocations.length : locations.length}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Selected</p>
        </div>
      </div>
    </div>
  )
}
