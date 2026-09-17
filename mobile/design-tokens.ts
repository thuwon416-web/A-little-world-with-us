export const designTokens = {
  colors: {
    primary: '#c5a8e8',
    secondary: '#e0c8f0',
    accent: '#d4b8e8',
    background: '#1a1525',
    surface: '#252033',
    surfaceAlt: '#3d3450',
    text: '#f0e8f5',
    muted: '#c4b8d4',
    border: '#3d3450',
    success: '#a8d4b8',
    warning: '#f0d4a0',
    danger: '#e8a8a8',
  },
  typography: {
    xs: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
    sm: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    md: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
    lg: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
    xl: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    xxl: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
    h1: { fontSize: 40, lineHeight: 48, fontWeight: '700' },
    h2: { fontSize: 32, lineHeight: 40, fontWeight: '600' },
    h3: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
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
  motion: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
} as const

export type DesignTokenColors = typeof designTokens.colors
export type DesignTokenTypography = typeof designTokens.typography
