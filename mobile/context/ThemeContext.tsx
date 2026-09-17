import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type CanonicalThemeName = 'lavender-mist' | 'peach-cream' | 'mint-whisper' | 'ocean-calm' | 'monochrome'
type LegacyThemeName = 'midnight' | 'sunset' | 'romantic' | 'ocean'
export type ThemeName = CanonicalThemeName | LegacyThemeName
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

export const themes: Record<CanonicalThemeName, ThemeColors> = {
  'lavender-mist': {
    background: '#1a1525',
    surface: '#252033',
    cardBg: '#252033',
    cardBorder: '#3d3450',
    textPrimary: '#f0e8f5',
    textSecondary: '#c4b8d4',
    accent1: '#c5a8e8',
    accent2: '#e0c8f0',
    accent3: '#d4b8e8',
    success: '#a8d4b8',
    warning: '#f0d4a0',
    error: '#e8a8a8',
  },
  'peach-cream': {
    background: '#fff5ed',
    surface: '#ffffff',
    cardBg: '#fff8f2',
    cardBorder: '#f0d5c0',
    textPrimary: '#3a2a2a',
    textSecondary: '#7a5a5a',
    accent1: '#c9603b',
    accent2: '#c95c45',
    accent3: '#f7b8a8',
    success: '#3a8a4a',
    warning: '#d9a03a',
    error: '#c95050',
  },
  'mint-whisper': {
    background: '#f0faf5',
    surface: '#e8f5ee',
    cardBg: '#e8f5ee',
    cardBorder: '#a8d8b8',
    textPrimary: '#1a3a28',
    textSecondary: '#4a6e58',
    accent1: '#2c8a5c',
    accent2: '#4db88a',
    accent3: '#7dd4aa',
    success: '#2c8a5c',
    warning: '#e0a84a',
    error: '#c97070',
  },
  'ocean-calm': {
    background: '#edf8ff',
    surface: '#f6fcff',
    cardBg: '#f6fcff',
    cardBorder: '#a7d8f0',
    textPrimary: '#133a52',
    textSecondary: '#4c6f89',
    accent1: '#2c6fb3',
    accent2: '#5cc3d5',
    accent3: '#87ceeb',
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
  preference: 'lavender-mist',
  theme: 'lavender-mist',
  colors: themes['lavender-mist'],
  setPreference: () => undefined,
})

const STORAGE_KEY = 'a-little-world-with-us-mobile-theme'
const LEGACY_MAP: Record<string, ThemeName> = {
  midnight: 'lavender-mist',
  sunset: 'peach-cream',
  romantic: 'mint-whisper',
  ocean: 'ocean-calm',
  monochrome: 'monochrome',
}

function resolveTheme(preference: ThemePreference): CanonicalThemeName {
  if (preference === 'midnight') return 'lavender-mist'
  if (preference === 'sunset') return 'peach-cream'
  if (preference === 'romantic') return 'mint-whisper'
  if (preference === 'ocean') return 'ocean-calm'
  return preference
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('lavender-mist')
  const [theme, setTheme] = useState<CanonicalThemeName>('lavender-mist')

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const migrated = stored !== null && LEGACY_MAP[stored] ? LEGACY_MAP[stored] : stored
      const next: ThemePreference =
        migrated === 'lavender-mist' ||
        migrated === 'peach-cream' ||
        migrated === 'mint-whisper' ||
        migrated === 'ocean-calm' ||
        migrated === 'monochrome'
          ? migrated
          : 'lavender-mist'
      setPreferenceState(next)
      setTheme(resolveTheme(next))
      void AsyncStorage.setItem(STORAGE_KEY, next)
    })
  }, [])

  const setPreference = (next: ThemePreference) => {
    const canonical = resolveTheme(next)
    setPreferenceState(canonical)
    setTheme(canonical)
    void AsyncStorage.setItem(STORAGE_KEY, canonical)
  }

  const value = useMemo(
    () => ({ preference, theme, colors: themes[theme], setPreference }),
    [preference, theme]
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
