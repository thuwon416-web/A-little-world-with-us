import { ActivityIndicator } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  const { colors } = useTheme()
  return <ActivityIndicator accessibilityLabel="Loading" size={size} color={colors.accent1} />
}
