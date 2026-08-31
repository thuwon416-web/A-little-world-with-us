'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'

type Ritual = {
  id: string
  label: string
  done: boolean
}

const starterRituals: Ritual[] = [
  { id: 'r1', label: 'Dance in the kitchen', done: true },
  { id: 'r2', label: 'Send a silly meme', done: false },
  { id: 'r3', label: 'Watch a favorite sunset together', done: true },
]

export default function PlayfulRituals() {
  const [rituals, setRituals] = useState<Ritual[]>(starterRituals)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('playful-rituals')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setRituals(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('playful-rituals', JSON.stringify(rituals))
  }, [rituals])

  const finished = useMemo(() => rituals.filter((ritual) => ritual.done).length, [rituals])
  const progress = rituals.length ? Math.round((finished / rituals.length) * 100) : 0

  const toggleRitual = (id: string) => {
    setRituals((current) =>
      current.map((ritual) => (ritual.id === id ? { ...ritual, done: !ritual.done } : ritual))
    )
  }

  const addRitual = () => {
    const value = draft.trim()
    if (!value) return
    setRituals((current) => [...current, { id: `ritual-${Date.now()}`, label: value, done: false }])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Star className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Playful Rituals</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {finished}/{rituals.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Joy meter</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--card-bg-strong)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-2)] to-[var(--accent-1)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {rituals.map((ritual) => (
          <motion.button
            key={ritual.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleRitual(ritual.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
              ritual.done
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-primary)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            <span>{ritual.label}</span>
            <span className="text-[9px] uppercase tracking-[0.18em]">
              {ritual.done ? 'done' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a playful ritual"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button
          onClick={addRitual}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add playful ritual"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
