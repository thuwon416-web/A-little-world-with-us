'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function LoveCalculator() {
  const [trust, setTrust] = useState(84)
  const [laughter, setLaughter] = useState(92)
  const [adventure, setAdventure] = useState(76)
  const [guess, setGuess] = useState('')

  const compatibility = useMemo(() => {
    return Math.round((trust + laughter + adventure) / 3)
  }, [trust, laughter, adventure])

  const vibe =
    compatibility > 85
      ? 'Soulmate energy'
      : compatibility > 70
        ? 'Very strong chemistry'
        : 'Growing beautifully'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Heart className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Love Calculator</h3>
      </div>

      <div className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.15em] opacity-60">Trust</label>
        <input
          type="range"
          min={0}
          max={100}
          value={trust}
          onChange={(e) => setTrust(Number(e.target.value))}
          className="w-full"
        />

        <label className="block text-xs uppercase tracking-[0.15em] opacity-60">Laughter</label>
        <input
          type="range"
          min={0}
          max={100}
          value={laughter}
          onChange={(e) => setLaughter(Number(e.target.value))}
          className="w-full"
        />

        <label className="block text-xs uppercase tracking-[0.15em] opacity-60">Adventure</label>
        <input
          type="range"
          min={0}
          max={100}
          value={adventure}
          onChange={(e) => setAdventure(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="glass-card p-3 rounded-2xl">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-60">Compatibility</span>
          <span className="font-semibold text-[var(--text-primary)]">{compatibility}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[var(--bg-2)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${compatibility}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
          />
        </div>
        <p className="mt-2 text-xs opacity-70">{vibe}</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.15em] opacity-60">Guess her answer</label>
        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="What would she say?"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-3 text-sm text-[var(--text-primary)] outline-none"
        />
        <p className="text-[11px] opacity-60">Hint: the answer is usually “more time with you.”</p>
      </div>
    </div>
  )
}
