'use client'

import { useState } from 'react'
import { Plus, X, Shield } from 'lucide-react'

interface SafeZonesProps {
  _coupleId: string
}

interface SafeZone {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
}

export default function SafeZones({ coupleId }: SafeZonesProps) {
  const [zones, setZones] = useState<SafeZone[]>([
    {
      id: '1',
      name: 'Home',
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 100,
      isActive: true,
    },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneRadius, setNewZoneRadius] = useState(100)

  const handleAddZone = () => {
    if (!newZoneName.trim()) return

    const newZone: SafeZone = {
      id: Date.now().toString(),
      name: newZoneName,
      latitude: 40.7128, // Would use current location in real implementation
      longitude: -74.0060,
      radius: newZoneRadius,
      isActive: true,
    }

    setZones([...zones, newZone])
    setNewZoneName('')
    setNewZoneRadius(100)
    setShowAddForm(false)
  }

  const handleRemoveZone = (id: string) => {
    setZones(zones.filter((zone) => zone.id !== id))
  }

  const handleToggleZone = (id: string) => {
    setZones(
      zones.map((zone) =>
        zone.id === id ? { ...zone, isActive: !zone.isActive } : zone
      )
    )
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--accent-1)]/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--accent-1)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Safe Zones</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 rounded-full bg-[var(--accent-1)]/10 hover:bg-[var(--accent-1)]/20 transition-colors"
          aria-label="Add safe zone"
        >
          <Plus className="w-4 h-4 text-[var(--accent-1)]" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-[var(--bg-2)] rounded-xl space-y-3">
          <input
            type="text"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            placeholder="Zone name (e.g., Home, Office)"
            className="w-full px-3 py-2 bg-[var(--bg-3)] border border-[var(--accent-1)]/20 rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
          />
          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Radius (meters): {newZoneRadius}
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={newZoneRadius}
              onChange={(e) => setNewZoneRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddZone}
              className="flex-1 px-3 py-2 bg-[var(--accent-1)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-2)] transition-colors"
            >
              Add Zone
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 bg-[var(--bg-3)] text-[var(--text-secondary)] rounded-lg text-sm hover:bg-[var(--bg-2)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {zones.length === 0 ? (
        <p className="text-[var(--text-secondary)] text-center py-8">
          No safe zones configured. Add one to get notifications when your partner arrives or leaves.
        </p>
      ) : (
        <div className="space-y-2">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center justify-between p-3 bg-[var(--bg-2)] rounded-xl hover:bg-[var(--bg-3)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleZone(zone.id)}
                  className={`p-2 rounded-full transition-colors ${
                    zone.isActive ? 'bg-green-500/20 text-green-500' : 'bg-[var(--bg-3)] text-[var(--text-secondary)]'
                  }`}
                  aria-label={zone.isActive ? 'Disable zone' : 'Enable zone'}
                >
                  <Shield className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{zone.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {zone.radius}m radius
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveZone(zone.id)}
                className="p-2 rounded-full hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                aria-label="Remove zone"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}