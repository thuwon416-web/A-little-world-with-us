'use client'

import { useState, useEffect } from 'react'
import { MapPin, Clock } from 'lucide-react'

interface LocationHistoryProps {
  coupleId: string
}

interface LocationEntry {
  id: string
  latitude: number
  longitude: number
  timestamp: string
  address?: string
}

export default function LocationHistory({ coupleId }: LocationHistoryProps) {
  const [history, setHistory] = useState<LocationEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch from Supabase
    const mockHistory: LocationEntry[] = [
      {
        id: '1',
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        address: 'Central Park, NYC',
      },
      {
        id: '2',
        latitude: 40.7580,
        longitude: -73.9855,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        address: 'Times Square, NYC',
      },
    ]
    
    setHistory(mockHistory)
    setIsLoading(false)
  }, [coupleId])

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--accent-1)]/20 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[var(--bg-3)] rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-12 bg-[var(--bg-3)] rounded" />
            <div className="h-12 bg-[var(--bg-3)] rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--accent-1)]/20 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-[var(--accent-1)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Location History</h3>
      </div>

      {history.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center py-8">
          No location history available yet
        </p>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-3 bg-[var(--bg-2)] rounded-xl hover:bg-[var(--bg-3)] transition-colors"
            >
              <div className="mt-1">
                <MapPin className="w-4 h-4 text-[var(--accent-1)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {entry.address || `${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}`}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(entry.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}