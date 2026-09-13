export const designTokens = {
  colors: {
    primary: '#ff6b9d',
    secondary: '#ffd166',
    accent: '#8d7bff',
    background: '#1a0b2e',
    backgroundMuted: '#2d1b4e',
    surface: '#221433',
    surfaceStrong: '#120c1d',
    text: '#f5f0ff',
    textMuted: '#d7d2e7',
    success: '#7ad7a4',
    warning: '#ffc857',
    danger: '#ff6b6b',
  },
  typography: {
    fontFamily: {
      display: 'var(--font-display)',
      body: 'var(--font-body)',
      accent: 'var(--font-accent)',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '2.5rem',
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.1,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },
  radius: {
    sm: '0.75rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    full: '9999px',
  },
  shadows: {
    soft: '0 12px 30px rgba(17, 10, 25, 0.18)',
    glow: '0 0 0 1px rgba(255, 107, 157, 0.2), 0 18px 38px rgba(255, 107, 157, 0.18)',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const

export const themePalettes = {
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
} as const

export const themePalette = designTokens.colors

export const typography = {
  fontFamily: {
    serif: '"Playfair Display", "Cormorant Garamond", Georgia, serif',
    sans: '"Inter", "Poppins", system-ui, sans-serif',
  },
  size: {
    h1: '2rem',
    h2: '1.5rem',
    h3: '1.25rem',
    body: '1rem',
    small: '0.875rem',
    caption: '0.75rem',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const

export default designTokens
