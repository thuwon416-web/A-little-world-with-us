/**
 * Theme tokens — SINGLE SOURCE OF TRUTH
 * Used by BOTH web (Next.js) and mobile (Expo RN).
 * DO NOT duplicate these values elsewhere.
 */

export const themes = {
  'lavender-mist': {
    bg: '#f3ecfa',
    card: '#ffffff',
    border: '#ddc8ea',
    text1: '#4a3860',
    text2: '#6b5284',
    label: '#a88ec4',
    accent1: '#7d5ca8',
    accent2: '#bca0d4',
    accent3: '#dcc8e8',
    cardTitle: '#6b4a94',
    statBg: '#fbf7fe',
    statBorder: '#e8ddf3',
    softTint: '#ede0f5',
  },
  'peach-cream': {
    bg: '#fdf2e8',
    card: '#ffffff',
    border: '#f0d0b0',
    text1: '#5f3b2a',
    text2: '#8a6450',
    label: '#d89a78',
    accent1: '#cc6f45',
    accent2: '#efb090',
    accent3: '#f8d5c0',
    cardTitle: '#b35a34',
    statBg: '#fffaf5',
    statBorder: '#f5ddc4',
    softTint: '#fbe4d0',
  },
  'mint-whisper': {
    bg: '#ecf6ef',
    card: '#ffffff',
    border: '#c4dccd',
    text1: '#264838',
    text2: '#507866',
    label: '#78b890',
    accent1: '#3d9068',
    accent2: '#82c498',
    accent3: '#b2dcc2',
    cardTitle: '#2e7250',
    statBg: '#f5fbf7',
    statBorder: '#d4ebdc',
    softTint: '#d8ebde',
  },
  'ocean-calm': {
    bg: '#eaf3fa',
    card: '#ffffff',
    border: '#c0d8ec',
    text1: '#1f3a54',
    text2: '#4e7694',
    label: '#6da0cc',
    accent1: '#3d7ab4',
    accent2: '#88b8da',
    accent3: '#b8d8ea',
    cardTitle: '#2d5f92',
    statBg: '#f5fafd',
    statBorder: '#d0e4f2',
    softTint: '#d4e6f2',
  },
  'monochrome': {
    bg: '#0f0f12',
    card: '#1a1a1e',
    border: '#2a2a30',
    text1: '#f0f0f4',
    text2: '#a8a8b0',
    label: '#a0a0a8',
    accent1: '#e0e0e4',
    accent2: '#888890',
    accent3: '#3a3a45',
    cardTitle: '#f0f0f4',
    statBg: '#16161a',
    statBorder: '#26262c',
    softTint: '#22222a',
  },
} as const

export const semantic = {
  success: '#85c99a',
  warning: '#e0c078',
  errorLight: '#d08a8a',
  errorDark: '#d88888',
} as const

export const sizes = {
  text: {
    xs: 12, sm: 14, body: 15, bodyLg: 17,
    hSm: 20, hMd: 24, hLg: 28, dSm: 36, dLg: 48,
  },
  space: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24,
    xxl: 32, xxxl: 40, huge: 48,
  },
  radius: {
    input: 12, btn: 16, card: 20, panel: 24,
    modal: 28, pill: 999,
  },
  icon: {
    inline: 14, ui: 16, btn: 20, nav: 24,
    card: 28, hero: 36, mega: 48,
  },
} as const

export type ThemeName = keyof typeof themes
export type ThemeTokens = typeof themes[ThemeName]
