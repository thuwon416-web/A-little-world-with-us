'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Sparkles } from 'lucide-react'

type Gift = {
  name: string
  vibe: string
  range: string
  note: string
}

const gifts: Gift[] = [
  {
    name: 'Polaroid memory frame',
    vibe: 'nostalgic',
    range: '$35-$60',
    note: 'A keepsake that lives on a bedside table.',
  },
  {
    name: 'Mini candle + handwritten note',
    vibe: 'romantic',
    range: '$20-$40',
    note: 'Simple, personal, and quietly luxurious.',
  },
  {
    name: 'Custom playlist + picnic basket',
    vibe: 'fun',
    range: '$30-$75',
    note: 'A little adventure that feels intimate.',
  },
  {
    name: 'Spa night kit',
    vibe: 'calm',
    range: '$50-$90',
    note: 'Perfect for reconnecting and recharging together.',
  },
]

export default function GiftRecommender() {
  const [budget, setBudget] = useState(60)
  const [vibe, setVibe] = useState('romantic')

  const matches = useMemo(() => {
    return gifts.filter((gift) => {
      const numeric = Number(
        gift.range.replace(/[^0-9-]/g, '').split('-')[1] || gift.range.replace(/[^0-9]/g, '')
      )
      const matchesBudget = numeric <= budget
      const matchesVibe = gift.vibe === vibe || vibe === 'any'
      return matchesBudget && matchesVibe
    })
  }, [budget, vibe])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Gift className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">AI Gift Recommender</h3>
      </div>

      <div className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.2em] opacity-60">Budget</label>
        <input
          type="range"
          min={20}
          max={120}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-right text-sm font-medium">${budget}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['any', 'romantic', 'calm', 'nostalgic', 'fun'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setVibe(option)}
            className={`rounded-full px-3 py-2 text-[11px] capitalize ${
              vibe === option
                ? 'bg-[var(--accent-1)] text-[var(--text-primary)] shadow-md'
                : 'bg-[var(--card-bg)]/35 text-[var(--text-primary)]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {matches.length ? (
          matches.map((gift) => (
            <motion.div
              key={gift.name}
              whileHover={{ y: -2 }}
              className="glass-card rounded-2xl p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-[var(--text-primary)]">{gift.name}</div>
                <div className="rounded-full bg-[var(--card-bg)]/40 px-2 py-1 text-[10px] uppercase tracking-[0.15em]">
                  {gift.range}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[var(--accent-1)] text-[11px] uppercase tracking-[0.15em]">
                <Sparkles className="w-3.5 h-3.5" />
                {gift.vibe}
              </div>
              <p className="mt-2 text-sm opacity-75">{gift.note}</p>
            </motion.div>
          ))
        ) : (
          <div className="rounded-2xl bg-[var(--card-bg)]/25 p-3 text-sm opacity-70">
            No match in this budget right now—try a wider range or a softer vibe.
          </div>
        )}
      </div>
    </div>
  )
}
