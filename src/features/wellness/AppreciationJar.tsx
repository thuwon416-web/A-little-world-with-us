'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Plus, Sparkles } from 'lucide-react'

type Appreciation = {
  id: string
  text: string
}

const starterAppreciations: Appreciation[] = [
  { id: 'a1', text: 'You make everything feel safer and softer.' },
  { id: 'a2', text: 'Your laughter is one of my favorite sounds.' },
]

export default function AppreciationJar() {
  const [items, setItems] = useState<Appreciation[]>(starterAppreciations)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('appreciation-jar')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('appreciation-jar', JSON.stringify(items))
  }, [items])

  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    setItems((current) => [...current, { id: `app-${Date.now()}`, text: value }])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Gift className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Appreciation Jar</h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3 text-sm text-[var(--text-primary)]/80"
          >
            {item.text}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write something you appreciate"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button
          onClick={addItem}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add appreciation item"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Reminder
        </div>
        <p>A gratitude note can turn a good day into a beautiful one.</p>
      </div>
    </div>
  )
}
