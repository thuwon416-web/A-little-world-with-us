import { ActivityIndicator } from 'react-native'

export function Spinner({ size = 'small' }: { size?: 'small' | 'large' }) {
  return <ActivityIndicator accessibilityLabel="Loading" size={size} color="#ff6b81" />
}
