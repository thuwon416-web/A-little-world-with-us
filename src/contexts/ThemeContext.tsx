'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'lavender-mist' | 'peach-cream' | 'mint-whisper' | 'ocean-calm' | 'monochrome'
export type ThemePreference = ThemeMode

export type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'lavender-mist',
  setMode: () => undefined,
  preference: 'lavender-mist',
  setPreference: () => undefined,
})

const EXPLICIT_MODES: ThemeMode[] = ['lavender-mist', 'peach-cream', 'mint-whisper', 'ocean-calm', 'monochrome']

const LEGACY_MAP: Record<string, ThemeMode> = {
  midnight: 'lavender-mist',
  sunset: 'peach-cream',
  romantic: 'mint-whisper',
  ocean: 'ocean-calm',
  monochrome: 'monochrome',
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && EXPLICIT_MODES.includes(value as ThemeMode)
}

function migrateThemeValue(value: string | null): string | null {
  return value !== null && LEGACY_MAP[value] ? LEGACY_MAP[value] : value
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [mode, setModeState] = useState<ThemeMode>('lavender-mist')
  const [preference, setPreferenceState] = useState<ThemePreference>('lavender-mist')

  useEffect(() => {
    setMounted(true)

    const storedMode = migrateThemeValue(localStorage.getItem('a-little-world-with-us-theme-mode'))
    const storedPreference = migrateThemeValue(
      localStorage.getItem('a-little-world-with-us-theme-preference')
    )

    if (storedPreference === 'random' || storedPreference === 'auto') {
      setModeState('lavender-mist')
      setPreferenceState('lavender-mist')
      return
    }

    if (isThemeMode(storedPreference)) {
      setModeState(storedPreference)
      setPreferenceState(storedPreference)
      return
    }

    if (storedMode && isThemeMode(storedMode)) {
      setModeState(storedMode)
      setPreferenceState(storedMode)
      return
    }

    setModeState('lavender-mist')
    setPreferenceState('lavender-mist')
  }, [])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.dataset.themeMode = mode
    document.documentElement.style.colorScheme =
      mode === 'lavender-mist' || mode === 'monochrome' ? 'dark' : 'light'

    localStorage.setItem('a-little-world-with-us-theme-mode', mode)
    localStorage.setItem('a-little-world-with-us-theme-preference', preference)
  }, [mode, mounted, preference])

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode: (nextMode) => {
          setModeState(nextMode)
        },
        preference,
        setPreference: (nextPreference) => {
          const normalized = LEGACY_MAP[nextPreference] ?? nextPreference
          setModeState(normalized)
          setPreferenceState(normalized)
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
