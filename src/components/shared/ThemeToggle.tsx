'use client'

import { MoonStar, Sparkles, SunMedium, Shuffle } from 'lucide-react'

import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeMode } from '@/contexts/ThemeContext'

const themeOptions = [
  { key: 'random', label: 'Random', icon: Shuffle },
  { key: 'romantic', label: 'Emergent Airy', icon: Sparkles },
  { key: 'midnight', label: 'Midnight Romance', icon: MoonStar },
  { key: 'sunset', label: 'Sunset Glow', icon: SunMedium },
  { key: 'ocean', label: 'Ocean Breeze', icon: Sparkles },
  { key: 'monochrome', label: 'Monochrome Noir', icon: MoonStar },
] as const

export default function ThemeToggle() {
  const { mode, setMode, autoMode, toggleAutoMode } = useTheme()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/70">
          Theme
        </span>
        <button
          type="button"
          onClick={toggleAutoMode}
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-2 py-1 text-[10px] font-medium text-[var(--text-primary)]/80 transition hover:bg-[var(--card-bg)]/45"
          aria-label="Toggle automatic theme mode"
        >
          {autoMode ? 'Auto' : 'Manual'}
        </button>
      </div>

      <div className="space-y-2">
        {themeOptions.map(({ key, label, icon: Icon }) => {
          const isActive = key === 'random' ? false : mode === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === 'random') {
                  const themes: ThemeMode[] = ['romantic', 'midnight', 'sunset', 'ocean', 'monochrome']
                  const randomTheme = themes[Math.floor(Math.random() * themes.length)]
                  setMode(randomTheme)
                } else {
                  setMode(key)
                }
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-full border px-3 py-2 text-left text-[11px] transition-all ${
                isActive
                  ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/12 text-[var(--text-primary)] shadow-[0_0_18px_rgba(255,182,193,0.2)]'
                  : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)]/80 hover:bg-[var(--card-bg)]'
              }`}
              aria-label={key === 'random' ? 'Set random theme' : `Set ${label} theme`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
              {isActive ? <span className="h-2 w-2 rounded-full bg-[var(--accent-2)]" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
