import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemePreference = 'midnight' | 'sunset' | 'random' | 'auto'
export type ThemeName = 'midnight' | 'sunset'

export const themes: Record<
  ThemeName,
  { background: string; card: string; text: string; muted: string; accent: string }
> = {
  midnight: {
    background: '#0f0f12',
    card: '#171b22',
    text: '#f3f0f5',
    muted: '#c4c4ce',
    accent: '#d9bfd7',
  },
  sunset: {
    background: '#24151b',
    card: '#3b2225',
    text: '#fff5ec',
    muted: '#f1c7ae',
    accent: '#ff9b78',
  },
}

type ThemeContextValue = {
  preference: ThemePreference
  theme: ThemeName
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'auto',
  theme: 'midnight',
  setPreference: () => undefined,
})

const STORAGE_KEY = 'a-little-world-with-us-mobile-theme'

function resolveTheme(preference: ThemePreference): ThemeName {
  if (preference === 'midnight' || preference === 'sunset') return preference
  if (preference === 'random') return Math.random() > 0.5 ? 'midnight' : 'sunset'
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'sunset' : 'midnight'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('auto')
  const [theme, setTheme] = useState<ThemeName>('midnight')

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const next = stored as ThemePreference | null
      if (next === 'midnight' || next === 'sunset' || next === 'random' || next === 'auto') {
        setPreferenceState(next)
        setTheme(resolveTheme(next))
      }
    })
  }, [])

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next)
    setTheme(resolveTheme(next))
    void AsyncStorage.setItem(STORAGE_KEY, next)
  }

  const value = useMemo(() => ({ preference, theme, setPreference }), [preference, theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
