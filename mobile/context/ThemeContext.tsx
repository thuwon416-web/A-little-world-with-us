import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { themes as themeTokens, semantic as semanticTokens } from '@/design-tokens'

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
    background: themeTokens['lavender-mist'].bg,
    surface: themeTokens['lavender-mist'].card,
    cardBg: themeTokens['lavender-mist'].card,
    cardBorder: themeTokens['lavender-mist'].border,
    textPrimary: themeTokens['lavender-mist'].text1,
    textSecondary: themeTokens['lavender-mist'].text2,
    accent1: themeTokens['lavender-mist'].accent1,
    accent2: themeTokens['lavender-mist'].accent2,
    accent3: themeTokens['lavender-mist'].accent3,
    success: semanticTokens.success,
    warning: semanticTokens.warning,
    error: semanticTokens.errorLight,
  },
  'peach-cream': {
    background: themeTokens['peach-cream'].bg,
    surface: themeTokens['peach-cream'].card,
    cardBg: themeTokens['peach-cream'].card,
    cardBorder: themeTokens['peach-cream'].border,
    textPrimary: themeTokens['peach-cream'].text1,
    textSecondary: themeTokens['peach-cream'].text2,
    accent1: themeTokens['peach-cream'].accent1,
    accent2: themeTokens['peach-cream'].accent2,
    accent3: themeTokens['peach-cream'].accent3,
    success: semanticTokens.success,
    warning: semanticTokens.warning,
    error: semanticTokens.errorLight,
  },
  'mint-whisper': {
    background: themeTokens['mint-whisper'].bg,
    surface: themeTokens['mint-whisper'].card,
    cardBg: themeTokens['mint-whisper'].card,
    cardBorder: themeTokens['mint-whisper'].border,
    textPrimary: themeTokens['mint-whisper'].text1,
    textSecondary: themeTokens['mint-whisper'].text2,
    accent1: themeTokens['mint-whisper'].accent1,
    accent2: themeTokens['mint-whisper'].accent2,
    accent3: themeTokens['mint-whisper'].accent3,
    success: semanticTokens.success,
    warning: semanticTokens.warning,
    error: semanticTokens.errorLight,
  },
  'ocean-calm': {
    background: themeTokens['ocean-calm'].bg,
    surface: themeTokens['ocean-calm'].card,
    cardBg: themeTokens['ocean-calm'].card,
    cardBorder: themeTokens['ocean-calm'].border,
    textPrimary: themeTokens['ocean-calm'].text1,
    textSecondary: themeTokens['ocean-calm'].text2,
    accent1: themeTokens['ocean-calm'].accent1,
    accent2: themeTokens['ocean-calm'].accent2,
    accent3: themeTokens['ocean-calm'].accent3,
    success: semanticTokens.success,
    warning: semanticTokens.warning,
    error: semanticTokens.errorLight,
  },
  monochrome: {
    background: themeTokens['monochrome'].bg,
    surface: themeTokens['monochrome'].card,
    cardBg: themeTokens['monochrome'].card,
    cardBorder: themeTokens['monochrome'].border,
    textPrimary: themeTokens['monochrome'].text1,
    textSecondary: themeTokens['monochrome'].text2,
    accent1: themeTokens['monochrome'].accent1,
    accent2: themeTokens['monochrome'].accent2,
    accent3: themeTokens['monochrome'].accent3,
    success: semanticTokens.success,
    warning: semanticTokens.warning,
    error: semanticTokens.errorDark,
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
