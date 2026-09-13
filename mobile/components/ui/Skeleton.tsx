import { useEffect, useRef } from 'react'
import { Animated, Easing, View, type ViewStyle } from 'react-native'

export function Skeleton({
  width = '100%',
  height = 20,
  style,
}: {
  width?: ViewStyle['width']
  height?: ViewStyle['height']
  style?: ViewStyle
}) {
  const shimmer = useRef(new Animated.Value(-1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    animation.start()
    return () => animation.stop()
  }, [shimmer])

  const translateX = shimmer.interpolate({
    inputRange: [-1, 1],
    outputRange: [-140, 140],
  })

  return (
    <View
      accessibilityLabel="Loading"
      style={[
        { width, height, borderRadius: 8, backgroundColor: '#242832', overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '140%',
          height: '100%',
          transform: [{ translateX }],
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      />
    </View>
  )
}
