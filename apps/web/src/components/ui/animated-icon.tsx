'use client'

import { motion, type Variants } from 'framer-motion'
import { forwardRef, useCallback, useImperativeHandle, useState, type ComponentProps } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const pathVariants: Variants = {
  normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
  draw: {
    pathLength: [0, 1],
    opacity: [0, 1],
    pathOffset: [1, 0],
    transition: { duration: 0.6, ease: 'linear' },
  },
}

const animationVariants: Record<Exclude<IconAnimation, 'none' | 'draw'>, Variants> = {
  bounce: {
    idle: { y: 0 },
    active: { y: [0, -5, 0], transition: { duration: 0.5, ease: 'easeOut' } },
  },
  pulse: {
    idle: { opacity: 1, scale: 1 },
    active: { opacity: [1, 0.55, 1], scale: [1, 1.08, 1], transition: { duration: 0.8 } },
  },
  wiggle: {
    idle: { rotate: 0 },
    active: { rotate: [0, -8, 8, -5, 5, 0], transition: { duration: 0.6 } },
  },
  spin: {
    idle: { rotate: 0 },
    active: { rotate: 360, transition: { duration: 0.7, ease: 'easeInOut' } },
  },
}

export const AnimatedIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(function AnimatedIcon(
  { name, size = 24, className, animation = 'none', trigger = 'mount', color },
  ref
) {
  const [active, setActive] = useState(trigger === 'mount')
  const startAnimation = useCallback(() => setActive(true), [])
  const stopAnimation = useCallback(() => setActive(false), [])

  useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }), [
    startAnimation,
    stopAnimation,
  ])

  const Icon = LucideIcons[name] as LucideIcon
  const isDraw = animation === 'draw'
  const variant = isDraw ? pathVariants : animation === 'none' ? undefined : animationVariants[animation]
  const state = active ? (isDraw ? 'draw' : 'active') : 'idle'
  const iconProps: ComponentProps<typeof Icon> = { size, color, 'aria-hidden': true }

  return (
    <motion.span
      className={cn('inline-flex', className)}
      variants={variant}
      initial={isDraw ? 'normal' : 'idle'}
      animate={variant ? state : undefined}
      onMouseEnter={trigger === 'hover' ? startAnimation : undefined}
      onMouseLeave={trigger === 'hover' ? stopAnimation : undefined}
      onPointerDown={trigger === 'press' ? startAnimation : undefined}
      onPointerUp={trigger === 'press' ? stopAnimation : undefined}
    >
      <Icon {...iconProps} />
    </motion.span>
  )
})

AnimatedIcon.displayName = 'AnimatedIcon'
