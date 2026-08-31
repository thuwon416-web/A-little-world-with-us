'use client'

import { useMemo, useState } from 'react'
import { MapPin, Navigation, ShieldCheck, Users } from 'lucide-react'

const partnerLocation = { lat: 13.7563, lng: 100.5018 }
const currentLocation = { lat: 13.7588, lng: 100.4945 }

export default function LocationPage() {
  const [sharingEnabled, setSharingEnabled] = useState(true)

  const distanceKm = useMemo(() => {
    const latDelta = Math.abs(currentLocation.lat - partnerLocation.lat)
    const lngDelta = Math.abs(currentLocation.lng - partnerLocation.lng)
    return (Math.sqrt(latDelta * latDelta + lngDelta * lngDelta) * 111.32).toFixed(1)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Shared location</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Where we are</h1>
        </div>
        <button
          type="button"
          onClick={() => setSharingEnabled((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            sharingEnabled
              ? 'bg-[var(--accent-1)] text-[var(--bg-color)]'
              : 'bg-[var(--card-bg-strong)] text-[var(--text-primary)]'
          }`}
        >
          {sharingEnabled ? 'Sharing live' : 'Share my location'}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="overflow-hidden rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
          <div className="relative h-[420px] w-full overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,107,157,0.2),_rgba(0,0,0,0)_48%),linear-gradient(135deg,_#21162e,_#15263d_55%,_#201437)]">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="absolute left-[18%] top-[25%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-[var(--card-bg-strong)] px-3 py-2 text-xs text-[var(--text-primary)]">
              <MapPin className="h-4 w-4 text-[var(--accent-1)]" />
              You
            </div>
            <div className="absolute left-[64%] top-[60%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-white/20 bg-[var(--card-bg-strong)] px-3 py-2 text-xs text-[var(--text-primary)]">
              <Users className="h-4 w-4 text-[var(--accent-2)]" />
              Partner
            </div>

            <div className="absolute left-[18%] top-[25%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--accent-1)] bg-white/90 shadow-[0_0_22px_rgba(255,107,157,0.8)]" />
            <div className="absolute left-[64%] top-[60%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--accent-2)] bg-white/90 shadow-[0_0_22px_rgba(255,209,102,0.8)]" />

            <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-[var(--card-bg-strong)]/80 px-4 py-3 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Last update</p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">2 min ago</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
                <Navigation className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Distance</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{distanceKm} km</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--accent-2)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--accent-2)]/15 p-2 text-[var(--accent-2)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Privacy</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {sharingEnabled ? 'Location visible only to your partner' : 'Location is paused'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
