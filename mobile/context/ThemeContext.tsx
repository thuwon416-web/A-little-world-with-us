import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeName = 'midnight' | 'sunset' | 'romantic' | 'ocean' | 'monochrome'
export type ThemePreference = ThemeName
export type ThemeColors = {
  background: string
  surface: string
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  accent1: string
  accent2: string
  accent3: string
  success: string
  warning: string
  error: string
}

export const typography = {
  fontFamily: {
    serif: 'Georgia',
    sans: 'System',
  },
  size: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    small: 14,
    caption: 12,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const

export const themes: Record<ThemeName, ThemeColors> = {
  midnight: {
    background: '#0f0f12',
    surface: '#171b22',
    cardBg: '#171b22',
    cardBorder: '#2a2d35',
    textPrimary: '#f3f0f5',
    textSecondary: '#c4c4ce',
    accent1: '#b88ae5',
    accent2: '#d9bfd7',
    accent3: '#f4e4c1',
    success: '#7ad7a4',
    warning: '#ffc857',
    error: '#ff9b9b',
  },
  sunset: {
    background: '#1a0f0a',
    surface: '#2a1810',
    cardBg: '#2a1810',
    cardBorder: '#543126',
    textPrimary: '#fff5ec',
    textSecondary: '#f1c7ae',
    accent1: '#ff9a56',
    accent2: '#ff6b9d',
    accent3: '#ffd93d',
    success: '#91d7a4',
    warning: '#ffd166',
    error: '#ff8f8f',
  },
  romantic: {
    background: '#fffbf0',
    surface: '#fff4d9',
    cardBg: '#fff8e6',
    cardBorder: '#e8d99a',
    textPrimary: '#4a3d1f',
    textSecondary: '#7d6b42',
    accent1: '#f4c04f',
    accent2: '#ffd97a',
    accent3: '#ffe08a',
    success: '#a3c586',
    warning: '#e6b84a',
    error: '#d97070',
  },
  ocean: {
    background: '#edf8ff',
    surface: '#d7f1ff',
    cardBg: '#f6fcff',
    cardBorder: '#a7d8f0',
    textPrimary: '#133a52',
    textSecondary: '#4c6f89',
    accent1: '#4a90e2',
    accent2: '#87ceeb',
    accent3: '#b7e4ff',
    success: '#5cc3d5',
    warning: '#e6b84a',
    error: '#d97070',
  },
  monochrome: {
    background: '#050505',
    surface: '#0e0e10',
    cardBg: '#111214',
    cardBorder: '#2a2d30',
    textPrimary: '#f5f5f3',
    textSecondary: '#b7b8bb',
    accent1: '#e6e7e9',
    accent2: '#a9adb3',
    accent3: '#c5c7ca',
    success: '#a3c586',
    warning: '#e6b84a',
    error: '#d97070',
  },
}

type ThemeContextValue = {
  preference: ThemePreference
  theme: ThemeName
  colors: ThemeColors
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'midnight',
  theme: 'midnight',
  colors: themes.midnight,
  setPreference: () => undefined,
})

const STORAGE_KEY = 'a-little-world-with-us-mobile-theme'

function resolveTheme(preference: ThemePreference): ThemeName {
  return preference
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('midnight')
  const [theme, setTheme] = useState<ThemeName>('midnight')

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const next: ThemePreference =
        stored === 'midnight' ||
        stored === 'sunset' ||
        stored === 'romantic' ||
        stored === 'ocean' ||
        stored === 'monochrome'
          ? stored
          : 'midnight'
      setPreferenceState(next)
      setTheme(resolveTheme(next))
    })
  }, [])

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next)
    setTheme(next)
    void AsyncStorage.setItem(STORAGE_KEY, next)
  }

  const value = useMemo(
    () => ({ preference, theme, colors: themes[theme], setPreference }),
    [preference, theme]
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
