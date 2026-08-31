export const designTokens = {
  colors: {
    primary: '#B88AE5',
    secondary: '#FF6B81',
    accent: '#D9BFD7',
    background: '#0F0F12',
    surface: '#171B22',
    surfaceAlt: '#1F232A',
    text: '#F3F0F5',
    muted: '#C4C4CE',
    border: '#2A2D35',
    success: '#2F8F66',
    warning: '#D8A133',
    danger: '#D9534F',
  },
  typography: {
    xs: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
    sm: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    md: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
    lg: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
    xl: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    xxl: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOpacity: 0.14,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    md: {
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
  },
} as const

export type DesignTokenColors = typeof designTokens.colors
export type DesignTokenTypography = typeof designTokens.typography
