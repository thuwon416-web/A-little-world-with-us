'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'romantic' | 'midnight' | 'sunset' | 'ocean' | 'monochrome'

export type ThemeContextType = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  autoMode: boolean
  toggleAutoMode: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'midnight',
  setMode: () => undefined,
  autoMode: true,
  toggleAutoMode: () => undefined,
})

const themeMap: Record<ThemeMode, ThemeMode> = {
  romantic: 'romantic',
  midnight: 'midnight',
  sunset: 'sunset',
  ocean: 'ocean',
  monochrome: 'monochrome',
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [mode, setModeState] = useState<ThemeMode>('midnight')
  const [autoMode, setAutoMode] = useState(true)

  useEffect(() => {
    setMounted(true)

    const storedMode = localStorage.getItem('a-little-world-with-us-theme-mode') as ThemeMode | null
    const storedAuto = localStorage.getItem('a-little-world-with-us-theme-auto')

    if (storedMode && themeMap[storedMode]) {
      setModeState(storedMode)
      setAutoMode(storedAuto !== 'false')
      return
    }

    const hour = new Date().getHours()
    const detectedMode: ThemeMode = hour >= 6 && hour < 18 ? 'romantic' : 'midnight'
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
  }, [mode, autoMode, mounted])

  useEffect(() => {
    if (!autoMode || !mounted) return

    const hour = new Date().getHours()
    const nextMode: ThemeMode = hour >= 6 && hour < 18 ? 'romantic' : 'midnight'
    setModeState(nextMode)
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
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
