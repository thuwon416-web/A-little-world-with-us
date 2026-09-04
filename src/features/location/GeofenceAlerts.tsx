'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, Bell, Home, Briefcase, Dumbbell } from 'lucide-react'

interface SafeZone {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  type: 'home' | 'work' | 'gym' | 'custom'
}

interface GeofenceAlertsProps {
  userLocation?: { latitude: number; longitude: number }
  onZoneAdd?: (zone: Omit<SafeZone, 'id'>) => void
  onZoneDelete?: (id: string) => void
}

export default function GeofenceAlerts({ userLocation, onZoneAdd, onZoneDelete }: GeofenceAlertsProps) {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([
    {
      id: '1',
      name: 'Home',
      latitude: 16.8661,
      longitude: 96.1951,
      radius: 100,
      type: 'home',
    },
    {
      id: '2',
      name: 'Work',
      latitude: 16.8000,
      longitude: 96.1500,
      radius: 100,
      type: 'work',
    },
  ])
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newZone, setNewZone] = useState<{
    name: string
    latitude: number
    longitude: number
    radius: number
    type: 'home' | 'work' | 'gym' | 'custom'
  }>({
    name: '',
    latitude: userLocation?.latitude || 16.8661,
    longitude: userLocation?.longitude || 96.1951,
    radius: 100,
    type: 'custom',
  })

  const _checkGeofence = (userLoc: { latitude: number; longitude: number }) => {
    safeZones.forEach((zone) => {
      const distance = calculateDistance(userLoc, zone)
      if (distance <= zone.radius / 1000) {
        // In production, this would send a notification
        // console.log(`Arrived at ${zone.name}`)
      }
    })
  }

  const calculateDistance = (loc1: { latitude: number; longitude: number }, zone: SafeZone): number => {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(zone.latitude - loc1.latitude)
    const dLon = toRad(zone.longitude - loc1.longitude)
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(loc1.latitude)) *
        Math.cos(toRad(zone.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRad = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  const handleAddZone = () => {
    const zone: SafeZone = {
      id: Date.now().toString(),
      ...newZone,
    }
    setSafeZones([...safeZones, zone])
    onZoneAdd?.(newZone)
    setShowAddForm(false)
    setNewZone({
      name: '',
      latitude: userLocation?.latitude || 16.8661,
      longitude: userLocation?.longitude || 96.1951,
      radius: 100,
      type: 'custom',
    })
  }

  const handleDeleteZone = (id: string) => {
    setSafeZones(safeZones.filter((zone) => zone.id !== id))
    onZoneDelete?.(id)
  }

  const getZoneIcon = (type: SafeZone['type']) => {
    switch (type) {
      case 'home':
        return <Home className="h-4 w-4" />
      case 'work':
        return <Briefcase className="h-4 w-4" />
      case 'gym':
        return <Dumbbell className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getZoneColor = (type: SafeZone['type']) => {
    switch (type) {
      case 'home':
        return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'work':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      case 'gym':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      default:
        return 'text-[var(--accent-1)] bg-[var(--accent-1)]/10 border-[var(--accent-1)]/20'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Safe Zones</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{safeZones.length} active</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 rounded-lg border border-[var(--accent-1)]/20 px-3 py-2 text-sm text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/10"
        >
          <Plus className="h-4 w-4" />
          Add Zone
        </button>
      </div>

      {/* Add Zone Form */}
      {showAddForm && (
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Add New Safe Zone</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Name</label>
              <input
                type="text"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="e.g., Gym, Coffee Shop"
                className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newZone.latitude}
                  onChange={(e) => setNewZone({ ...newZone, latitude: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-secondary)]">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newZone.longitude}
                  onChange={(e) => setNewZone({ ...newZone, longitude: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Radius (meters)</label>
              <input
                type="number"
                value={newZone.radius}
                onChange={(e) => setNewZone({ ...newZone, radius: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-secondary)]">Type</label>
              <select
                value={newZone.type}
                onChange={(e) => setNewZone({ ...newZone, type: e.target.value as any })}
                className="w-full rounded-lg border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="gym">Gym</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddZone}
                className="flex-1 rounded-lg bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
              >
                Add Zone
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-[var(--accent-1)]/20 px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-[var(--accent-1)]/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Zones List */}
      <div className="space-y-2">
        {safeZones.map((zone) => {
          const colorClass = getZoneColor(zone.type)
          const isInside = userLocation ? calculateDistance(userLocation, zone) <= zone.radius / 1000 : false
          
          return (
            <div
              key={zone.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                isInside ? colorClass : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]'
              }`}
            >
              <div className={`rounded-lg p-2 ${isInside ? colorClass : 'bg-[var(--accent-1)]/15 text-[var(--accent-1)]'}`}>
                {getZoneIcon(zone.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{zone.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)} • {zone.radius}m
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isInside && (
                  <span className="text-xs font-medium text-[var(--accent-1)]">Inside</span>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteZone(zone.id)}
                  className="rounded-lg p-1 text-[var(--text-secondary)] transition hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
