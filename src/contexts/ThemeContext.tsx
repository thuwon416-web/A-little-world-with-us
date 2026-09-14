'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'romantic' | 'midnight' | 'sunset' | 'ocean' | 'monochrome'
export type ThemePreference = ThemeMode

export type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'midnight',
  setMode: () => undefined,
  preference: 'midnight',
  setPreference: () => undefined,
})

const themeMap: Record<ThemeMode, ThemeMode> = {
  romantic: 'romantic',
  midnight: 'midnight',
  sunset: 'sunset',
  ocean: 'ocean',
  monochrome: 'monochrome',
}

const EXPLICIT_MODES: ThemeMode[] = ['romantic', 'midnight', 'sunset', 'ocean', 'monochrome']

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && EXPLICIT_MODES.includes(value as ThemeMode)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [mode, setModeState] = useState<ThemeMode>('midnight')
  const [preference, setPreferenceState] = useState<ThemePreference>('midnight')

  useEffect(() => {
    setMounted(true)

    const storedMode = localStorage.getItem('a-little-world-with-us-theme-mode') as ThemeMode | null
    const storedPreference = localStorage.getItem('a-little-world-with-us-theme-preference')

    if (storedPreference === 'random' || storedPreference === 'auto') {
      setModeState('midnight')
      setPreferenceState('midnight')
      return
    }

    if (isThemeMode(storedPreference)) {
      setModeState(storedPreference)
      setPreferenceState(storedPreference)
      return
    }

    if (storedMode && themeMap[storedMode]) {
      setModeState(storedMode)
      setPreferenceState(storedMode)
      return
    }

    setModeState('midnight')
    setPreferenceState('midnight')
  }, [])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.dataset.themeMode = mode
    document.documentElement.style.colorScheme =
      mode === 'midnight' || mode === 'monochrome' ? 'dark' : 'light'

    localStorage.setItem('a-little-world-with-us-theme-mode', mode)
    localStorage.setItem('a-little-world-with-us-theme-preference', preference)
  }, [mode, mounted, preference])

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--bg-1)]" />
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode: (nextMode) => {
          setModeState(nextMode)
        },
        preference,
        setPreference: (nextPreference) => {
          setModeState(nextPreference)
          setPreferenceState(nextPreference)
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
