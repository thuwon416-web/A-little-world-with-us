'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, Shield, Users, Clock, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Location {
  id: string
  user_id: string
  latitude: number
  longitude: number
  timestamp: string
  accuracy: number | null
  created_at: string
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userLocations, setUserLocations] = useState<Record<string, Location[]>>({})

  useEffect(() => {
    checkAdminAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        window.location.href = '/dashboard'
        return
      }

      setIsAdmin(true)
      loadAdminData()
    } catch (error) {
      console.error('Failed to check admin access:', error)
      window.location.href = '/dashboard'
    }
  }

  const loadAdminData = async () => {
    try {
      setIsLoading(true)

      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError
      setProfiles(profilesData || [])

      // Load all locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000)

      if (locationsError) throw locationsError
      setLocations(locationsData || [])

      // Group locations by user
      const grouped = (locationsData || []).reduce((acc, loc) => {
        if (!acc[loc.user_id]) {
          acc[loc.user_id] = []
        }
        acc[loc.user_id].push(loc)
        return acc
      }, {} as Record<string, Location[]>)

      setUserLocations(grouped)

      // Select first user by default
      if (profilesData && profilesData.length > 0) {
        setSelectedUser(profilesData[0].id)
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
      alert(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedUserLocations = selectedUser ? userLocations[selectedUser] || [] : []
  const selectedProfile = profiles.find(p => p.id === selectedUser)
  const lastLocation = selectedUserLocations.length > 0 ? selectedUserLocations[0] : null

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[var(--accent-1)]" />
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Checking access...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[var(--accent-1)]" />
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Loading location data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Admin Console</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Location Tracking</h1>
        </div>
        <button
          type="button"
          onClick={loadAdminData}
          className="flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Map View */}
        <div className="overflow-hidden rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
          <div className="relative h-[500px] w-full overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,107,157,0.2),_rgba(0,0,0,0)_48%),linear-gradient(135deg,_#21162e,_#15263d_55%,_#201437)]">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Map placeholder - would integrate with real map library */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-[var(--accent-1)]" />
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Map Integration Required</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]/60">Integrate with Google Maps or Mapbox</p>
              </div>
            </div>

            {/* User markers */}
            {selectedUserLocations.length > 0 && (
              <>
                <div className="absolute left-[50%] top-[50%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-[var(--card-bg-strong)] px-3 py-2 text-xs text-[var(--text-primary)]">
                  <Users className="h-4 w-4 text-[var(--accent-1)]" />
                  {selectedProfile?.full_name || selectedProfile?.email}
                </div>
                <div className="absolute left-[50%] top-[50%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--accent-1)] bg-white/90 shadow-[0_0_22px_rgba(255,107,157,0.8)]" />
              </>
            )}

            {/* Last update info */}
            {lastLocation && (
              <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-[var(--card-bg-strong)]/80 px-4 py-3 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Last update</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {new Date(lastLocation.timestamp).toLocaleString()}
                </p>
                {lastLocation.accuracy && (
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Accuracy: ±{lastLocation.accuracy.toFixed(0)}m
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* User selector */}
          <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Tracked Users</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{profiles.length} active</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setSelectedUser(profile.id)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedUser === profile.id
                      ? 'bg-[var(--accent-1)] text-[var(--bg-color)]'
                      : 'bg-[var(--card-bg-strong)] text-[var(--text-primary)] hover:bg-[var(--accent-1)]/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent-2)]/20 flex items-center justify-center text-xs font-medium">
                      {profile.full_name?.[0] || profile.email[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.full_name || profile.email}</p>
                      <p className="text-xs opacity-70 truncate">{profile.email}</p>
                    </div>
                    {profile.role === 'admin' && (
                      <Shield className="h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Location stats */}
          {lastLocation && (
            <div className="rounded-[24px] border border-[var(--accent-2)]/20 bg-[var(--card-bg)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-[var(--accent-2)]/15 p-2 text-[var(--accent-2)]">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Current Location</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                    {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(lastLocation.timestamp).toLocaleString()}</span>
                </div>
                {lastLocation.accuracy && (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <MapPin className="h-3 w-3" />
                    <span>Accuracy: ±{lastLocation.accuracy.toFixed(0)}m</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total locations */}
          <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Total Locations</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{locations.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location history table */}
      {selectedUserLocations.length > 0 && (
        <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
          <h2 className="mb-4 text-lg font-serif text-[var(--text-primary)]">Location History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--accent-1)]/20">
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Latitude</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Longitude</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {selectedUserLocations.slice(0, 20).map((location) => (
                  <tr key={location.id} className="border-b border-[var(--accent-1)]/10">
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {new Date(location.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {location.latitude.toFixed(6)}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {location.longitude.toFixed(6)}
                    </td>
                    <td className="px-4 py-2 text-[var(--text-primary)]">
                      {location.accuracy ? `±${location.accuracy.toFixed(0)}m` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
