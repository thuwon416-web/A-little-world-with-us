'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { motion } from 'framer-motion'
import { Gift, Heart, Sparkles, Star } from 'lucide-react'

const burstStyles = {
  hearts: { label: 'Heart burst', color: '#FF6B9D' },
  stars: { label: 'Star shower', color: '#FFD700' },
  flowers: { label: 'Flower pop', color: '#C41E3A' },
} as const

type BurstType = keyof typeof burstStyles

export default function CelebrationEffects() {
  const [lastBurst, setLastBurst] = useState<BurstType>('hearts')

  const triggerBurst = (type: BurstType) => {
    setLastBurst(type)

    if (type === 'hearts') {
      confetti({
        particleCount: 120,
        spread: 70,
        startVelocity: 40,
        colors: ['#FF6B9D', '#FFB6C1', '#FFD700', '#FFF8F0'],
        scalar: 1.2,
      })
      return
    }

    if (type === 'stars') {
      confetti({
        particleCount: 150,
        spread: 90,
        startVelocity: 35,
        shapes: ['star'],
        colors: ['#FFD700', '#FFF8F0', '#FFB6C1'],
        scalar: 1.1,
      })
      return
    }

    confetti({
      particleCount: 110,
      spread: 110,
      startVelocity: 25,
      colors: ['#C41E3A', '#FF6B9D', '#FFB6C1', '#FFF8F0'],
      scalar: 1.15,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Celebration Effects</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(burstStyles) as BurstType[]).map((type) => {
          const Icon = type === 'hearts' ? Heart : type === 'stars' ? Star : Gift
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
              onClick={() => triggerBurst(type)}
              className="glass-button px-3 py-2 text-[11px] flex items-center gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              {burstStyles[type].label}
            </motion.button>
          )
        })}
      </div>

      <div className="glass-card rounded-2xl p-3 text-sm">
        <div className="text-xs uppercase tracking-[0.2em] opacity-60">Latest spark</div>
        <div className="mt-2 font-medium text-[var(--text-primary)]">
          {burstStyles[lastBurst].label}
        </div>
      </div>
    </div>
  )
}
