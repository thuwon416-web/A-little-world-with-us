'use client'

import { Circle, MoonStar, Sparkles, SunMedium, Waves } from 'lucide-react'

import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeMode } from '@/contexts/ThemeContext'

const themeOptions: Array<{ key: ThemeMode; label: string; icon: typeof Sparkles }> = [
  { key: 'lavender-mist', label: 'Lavender Mist', icon: MoonStar },
  { key: 'peach-cream', label: 'Peach Cream', icon: SunMedium },
  { key: 'mint-whisper', label: 'Mint Whisper', icon: Sparkles },
  { key: 'ocean-calm', label: 'Ocean Calm', icon: Waves },
  { key: 'monochrome', label: 'Monochrome', icon: Circle },
]

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-1/70">
          Theme
        </span>
        <span className="text-[10px] text-text-1/60">{preference}</span>
      </div>

      <div className="space-y-2">
        {themeOptions.map(({ key, label, icon: Icon }) => {
          const isActive = preference === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPreference(key)
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-full border px-3 py-2 text-left text-[11px] transition-all ${
                isActive
                  ? 'border-accent-1 bg-accent-1/12 text-text-1 shadow-[0_0_18px_rgba(255,182,193,0.2)]'
                  : 'border-accent-1/20 bg-card text-text-1/80 hover:bg-card'
              }`}
              aria-label={`Set ${label} theme`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              {isActive ? <span className="h-2 w-2 rounded-full bg-accent-2" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
