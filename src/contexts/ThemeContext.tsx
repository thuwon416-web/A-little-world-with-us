'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'midnight' | 'sunset' | 'ocean' | 'monochrome'
export type ThemePreference = 'midnight' | 'sunset' | 'random' | 'auto'

export type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  autoMode: boolean
  toggleAutoMode: () => void
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'midnight',
  setMode: () => undefined,
  autoMode: true,
  toggleAutoMode: () => undefined,
  preference: 'auto',
  setPreference: () => undefined,
})

const themeMap: Record<ThemeMode, ThemeMode> = {
  midnight: 'midnight',
  sunset: 'sunset',
  ocean: 'ocean',
  monochrome: 'monochrome',
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [mode, setModeState] = useState<ThemeMode>('midnight')
  const [autoMode, setAutoMode] = useState(true)
  const [preference, setPreferenceState] = useState<ThemePreference>('auto')

  useEffect(() => {
    setMounted(true)

    const storedMode = localStorage.getItem('a-little-world-with-us-theme-mode') as ThemeMode | null
    const storedAuto = localStorage.getItem('a-little-world-with-us-theme-auto')
    const storedPreference = localStorage.getItem('a-little-world-with-us-theme-preference') as ThemePreference | null

    if (storedPreference === 'random') {
      const savedRandom = sessionStorage.getItem('a-little-world-with-us-random-theme') as ThemeMode | null
      const nextMode = savedRandom === 'midnight' || savedRandom === 'sunset'
        ? savedRandom
        : Math.random() > 0.5 ? 'midnight' : 'sunset'
      sessionStorage.setItem('a-little-world-with-us-random-theme', nextMode)
      setModeState(nextMode)
      setPreferenceState('random')
      setAutoMode(false)
      return
    }

    if (storedPreference === 'auto') {
      setModeState(window.matchMedia('(prefers-color-scheme: light)').matches ? 'sunset' : 'midnight')
      setPreferenceState('auto')
      setAutoMode(true)
      return
    }

    if (storedPreference === 'midnight' || storedPreference === 'sunset') {
      setModeState(storedPreference)
      setPreferenceState(storedPreference)
      setAutoMode(false)
      return
    }

    if (storedMode && themeMap[storedMode]) {
      setModeState(storedMode)
      setAutoMode(storedAuto !== 'false')
      setPreferenceState(storedAuto !== 'false' ? 'auto' : storedMode === 'sunset' ? 'sunset' : 'midnight')
      return
    }

      const detectedMode: ThemeMode = window.matchMedia('(prefers-color-scheme: light)').matches ? 'sunset' : 'midnight'
      setModeState(detectedMode)
    setAutoMode(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    document.documentElement.dataset.themeMode = mode
    document.documentElement.style.colorScheme =
      mode === 'midnight' || mode === 'monochrome' ? 'dark' : 'light'

    localStorage.setItem('a-little-world-with-us-theme-mode', mode)
    localStorage.setItem('a-little-world-with-us-theme-auto', String(autoMode))
    localStorage.setItem('a-little-world-with-us-theme-preference', preference)
  }, [mode, autoMode, mounted, preference])

  useEffect(() => {
    if (!autoMode || !mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const updateTheme = () => setModeState(mediaQuery.matches ? 'sunset' : 'midnight')
    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [autoMode, mounted])

  if (!mounted) {
    return <div className="min-h-screen bg-[var(--bg-1)]" />
  }

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode: (nextMode) => {
          setAutoMode(false)
          setModeState(nextMode)
        },
        autoMode,
        toggleAutoMode: () => setAutoMode((prev) => !prev),
        preference,
        setPreference: (nextPreference) => {
          if (nextPreference === 'random') {
            const nextMode: ThemeMode = Math.random() > 0.5 ? 'midnight' : 'sunset'
            sessionStorage.setItem('a-little-world-with-us-random-theme', nextMode)
            setModeState(nextMode)
            setAutoMode(false)
          } else if (nextPreference === 'auto') {
            setModeState(window.matchMedia('(prefers-color-scheme: light)').matches ? 'sunset' : 'midnight')
            setAutoMode(true)
          } else {
            setModeState(nextPreference)
            setAutoMode(false)
          }
          setPreferenceState(nextPreference)
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
