import { View, type ViewStyle } from 'react-native'

export function Skeleton({
  width = '100%',
  height = 20,
  style,
}: {
  width?: ViewStyle['width']
  height?: ViewStyle['height']
  style?: ViewStyle
}) {
  return (
    <View
      accessibilityLabel="Loading"
      style={[{ width, height, borderRadius: 8, backgroundColor: '#242832' }, style]}
    />
  )
}
