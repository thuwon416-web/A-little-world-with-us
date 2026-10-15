'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger: boolean
}

/**
 * Triggers a romantic confetti burst from both corners.
 * Run when trigger becomes true (e.g., on her birthday).
 */
export default function Confetti({ trigger }: ConfettiProps) {
  useEffect(() => {
    if (!trigger) return

    const duration = 4000
    const end = Date.now() + duration
    const colors = ['#FFB6C1', '#FFD700', '#FF69B4', '#FFF8F0', '#FF1493']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        disableForReducedMotion: true,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        disableForReducedMotion: true,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [trigger])

  return null
}
