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
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
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

export const themePalette = designTokens.colors
export default designTokens
