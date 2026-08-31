'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkle } from 'lucide-react'
import { useTheme } from '@/features/auth/ThemeProvider'

interface AmbientBackgroundProps {
  density?: 'low' | 'medium' | 'high'
}

export default function AmbientBackground({ density = 'medium' }: AmbientBackgroundProps) {
  const { mode } = useTheme()
  const isMonochrome = mode === 'monochrome'
  const count = density === 'low' ? 6 : density === 'high' ? 14 : 10

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 16,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      isHeart: Math.random() > 0.4,
      opacity: 0.15 + Math.random() * 0.25,
      driftX: Math.random() * 60 - 30,
    }))
  }, [count])

  const sparkles = useMemo(() => {
    return Array.from({ length: count * 2 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 3 + Math.random() * 6,
      duration: 1.5 + Math.random() * 3,
      delay: Math.random() * 4,
    }))
  }, [count])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Soft glowing orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-rose-deep/10 blur-3xl animate-glow-pulse" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-gold/8 blur-3xl animate-glow-pulse"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-midnight-400/10 blur-3xl animate-glow-pulse"
        style={{ animationDelay: '0.8s' }}
      />

      {/* Floating hearts */}
      {particles.map((p) => (
        <motion.div
          key={`heart-${p.id}`}
          className="absolute"
          style={{ left: `${p.left}%`, bottom: '-5%' }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [0, -1100],
            opacity: [0, p.opacity, p.opacity, 0],
            scale: [0, 1, 1, 0.5],
            x: [0, p.driftX, -p.driftX, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          {p.isHeart ? (
            <Heart
              className={
                isMonochrome
                  ? 'fill-slate-200/20 text-slate-200/30'
                  : 'fill-rose-soft/30 text-rose-soft/40'
              }
              style={{ width: p.size, height: p.size }}
            />
          ) : (
            <div
              className="rounded-full bg-gold/40"
              style={{
                width: p.size * 0.5,
                height: p.size * 0.5,
                boxShadow: isMonochrome
                  ? '0 0 8px rgba(255,255,255,0.16)'
                  : '0 0 8px rgba(255,215,0,0.4)',
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
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: 'easeInOut',
          }}
        >
          <Sparkle
            className={isMonochrome ? 'text-slate-200/50' : 'text-gold/60'}
            style={{ width: s.size, height: s.size }}
          />
        </motion.div>
      ))}
    </div>
  )
}
