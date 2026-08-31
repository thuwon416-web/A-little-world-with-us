'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'

type Affirmation = {
  id: string
  text: string
  tone: 'warm' | 'deep' | 'playful' | 'grounded'
}

const starterAffirmations: Affirmation[] = [
  { id: 'a1', text: 'You are my favorite place to return to.', tone: 'warm' },
  { id: 'a2', text: 'The way you love me makes life feel gentler.', tone: 'deep' },
  { id: 'a3', text: 'Even the ordinary moments feel beautiful with you in them.', tone: 'playful' },
]

const toneMap: Record<Affirmation['tone'], string> = {
  warm: 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]',
  deep: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
  playful: 'bg-[var(--bg-2)] text-[var(--accent-1)]',
  grounded: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
}

export default function AffirmationDeck() {
  const [items, setItems] = useState<Affirmation[]>(starterAffirmations)
  const [selectedId, setSelectedId] = useState(starterAffirmations[0]?.id ?? '')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('affirmation-deck')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
        if (parsed && typeof parsed[0]?.id === 'string') setSelectedId(parsed[0].id)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('affirmation-deck', JSON.stringify(items))
  }, [items])

  const active = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Star className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Affirmation Deck</h3>
      </div>

      <div className="grid gap-2">
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedId(item.id)}
            className={`rounded-2xl border p-3 text-left transition ${
              selectedId === item.id
                ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[var(--text-primary)]">{item.text}</span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.15em] ${toneMap[item.tone]}`}
              >
                {item.tone}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        key={active?.id ?? 'empty'}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80"
      >
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Today’s reminder
        </div>
        <p>{active?.text ?? 'You are loved, even in the quiet moments.'}</p>
      </motion.div>
    </div>
  )
}
