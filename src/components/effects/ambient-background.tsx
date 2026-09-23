'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkle } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

interface AmbientBackgroundProps {
  density?: 'low' | 'medium' | 'high'
}

export default function AmbientBackground({ density = 'medium' }: AmbientBackgroundProps) {
  const prefersReduced = usePrefersReducedMotion()
  const count = density === 'low' ? 4 : density === 'high' ? 8 : 6

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: (i * 37 + 13) % 100,
      size: 8 + ((i * 7) % 16),
      duration: 8 + ((i * 5) % 12),
      delay: (i * 3) % 8,
      isHeart: i % 3 !== 1,
      opacity: 0.15 + ((i * 11) % 25) / 100,
      driftX: ((i * 17) % 60) - 30,
    }))
  }, [count])

  const sparkles = useMemo(() => {
    return Array.from({ length: count * 2 }, (_, i) => ({
      id: i,
      left: (i * 29 + 7) % 100,
      top: (i * 43 + 19) % 100,
      size: 3 + ((i * 5) % 6),
      duration: 1.5 + ((i * 7) % 3),
      delay: (i * 2) % 4,
    }))
  }, [count])

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden -z-10 hidden md:block">
      {/* Soft glowing orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent-1/10 blur-3xl animate-glow-pulse" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent-2/10 blur-3xl animate-glow-pulse"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-accent-3/10 blur-3xl animate-glow-pulse"
        style={{ animationDelay: '0.8s' }}
      />

      {/* Floating hearts */}
      {particles.map((p) => (
        <motion.div
          key={`heart-${p.id}`}
          className="absolute"
          style={{ left: `${p.left}%`, bottom: '-5%' }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={prefersReduced ? {} : {
            y: [0, -1100],
            opacity: [0, p.opacity, p.opacity, 0],
            scale: [0, 1, 1, 0.5],
            x: [0, p.driftX, -p.driftX, 0],
          }}
          transition={prefersReduced ? {} : {
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          {p.isHeart ? (
            <Heart
              className="fill-accent-1/20 text-accent-1/30"
              style={{ width: p.size, height: p.size }}
            />
          ) : (
            <div
              className="rounded-full bg-accent-2/40"
              style={{
                width: p.size * 0.5,
                height: p.size * 0.5,
                boxShadow: '0 0 8px rgb(var(--accent-2) / 0.35)',
              }}
            />
          )}
        </motion.div>
      ))}

      {/* Twinkling sparkles */}
      {sparkles.map((s) => (
        <motion.div
          key={`spark-${s.id}`}
          className="absolute"
          style={{ left: `${s.left}%`, top: `${s.top}%` }}
          animate={prefersReduced ? {} : {
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={prefersReduced ? {} : {
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        >
          <Sparkle
            className="text-accent-2/60"
            style={{ width: s.size, height: s.size }}
          />
        </motion.div>
      ))}
    </div>
  )
}
