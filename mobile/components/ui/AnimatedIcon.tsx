import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import * as LucideIcons from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

export type IconAnimation = 'draw' | 'bounce' | 'pulse' | 'wiggle' | 'spin' | 'none'

export interface AnimatedIconHandle {
  startAnimation: () => void
  stopAnimation: () => void
}

export interface AnimatedIconProps {
  name: keyof typeof LucideIcons
  size?: number
  className?: string
  animation?: IconAnimation
  trigger?: 'hover' | 'press' | 'mount' | 'manual'
  color?: string
}

const AnimatedView = Animated.createAnimatedComponent(View)

export const AnimatedIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(function AnimatedIcon(
  { name, size = 24, animation = 'none', trigger = 'mount', color = 'currentColor' },
  ref
) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const rotation = useSharedValue(0)
  const translateY = useSharedValue(0)

  const stopAnimation = useCallback(() => {
    scale.value = withTiming(1)
    opacity.value = withTiming(1)
    rotation.value = withTiming(0)
    translateY.value = withTiming(0)
  }, [opacity, rotation, scale, translateY])

  const startAnimation = useCallback(() => {
    if (animation === 'none') return

    const timing = { duration: 600, easing: Easing.out(Easing.cubic) }
    if (animation === 'draw') {
      opacity.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, timing))
      scale.value = withSequence(withTiming(0.8, { duration: 0 }), withTiming(1, timing))
    } else if (animation === 'bounce') {
      translateY.value = withSequence(withTiming(-5, { duration: 220 }), withTiming(0, timing))
    } else if (animation === 'pulse') {
      opacity.value = withSequence(withTiming(0.55, { duration: 300 }), withTiming(1, timing))
      scale.value = withSequence(withTiming(1.08, { duration: 300 }), withTiming(1, timing))
    } else if (animation === 'wiggle') {
      rotation.value = withSequence(
        withTiming(-8, { duration: 100 }),
        withTiming(8, { duration: 160 }),
        withTiming(0, timing)
      )
    } else if (animation === 'spin') {
      rotation.value = withTiming(360, timing)
    }
  }, [animation, opacity, rotation, scale, translateY])

  useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }), [
    startAnimation,
    stopAnimation,
  ])

  useEffect(() => {
    if (trigger === 'mount') startAnimation()
    return () => stopAnimation()
  }, [startAnimation, stopAnimation, trigger])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }))

  const Icon = LucideIcons[name] as LucideIcon
  const content = (
    <AnimatedView style={animatedStyle}>
      <Icon size={size} color={color} />
    </AnimatedView>
  )

  if (trigger === 'press') {
    return (
      <Pressable
        onPressIn={startAnimation}
        onPressOut={stopAnimation}
      >
        {content}
      </Pressable>
    )
  }

  return content
})

AnimatedIcon.displayName = 'AnimatedIcon'
