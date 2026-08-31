'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, Sparkles, Star } from 'lucide-react'

const defaultRituals = [
  { id: 'sunrise-cafe', label: 'Sunrise coffee date', completed: true },
  { id: 'moonlit-walk', label: 'Moonlit walk', completed: false },
  { id: 'handwritten-note', label: 'Handwritten love note', completed: true },
  { id: 'stargazing', label: 'Stargazing night', completed: false },
  { id: 'favorite-dinner', label: 'Favorite dinner at home', completed: false },
]

export default function RelationshipRituals() {
  const [rituals, setRituals] = useState(defaultRituals)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('relationship-rituals')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRituals(parsed)
        }
      }
    } catch {
      // ignore local storage issues gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('relationship-rituals', JSON.stringify(rituals))
  }, [rituals])

  const completedCount = useMemo(
    () => rituals.filter((ritual) => ritual.completed).length,
    [rituals]
  )

  const progress = Math.round((completedCount / rituals.length) * 100)

  const toggleRitual = (id: string) => {
    setRituals((current) =>
      current.map((ritual) =>
        ritual.id === id ? { ...ritual, completed: !ritual.completed } : ritual
      )
    )
  }

  const addRitual = () => {
    const value = draft.trim()
    if (!value) return

    setRituals((current) => [
      ...current,
      { id: `custom-${Date.now()}`, label: value, completed: false },
    ])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Heart className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Relationship Rituals</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {completedCount}/{rituals.length} done
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Love rhythm</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--card-bg-strong)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--accent-2)]"
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
              ritual.completed
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-primary)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${ritual.completed ? 'fill-current' : ''}`} />
              {ritual.label}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em]">
              {ritual.completed ? 'done' : 'plan'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a sweet ritual"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40 outline-none ring-0"
        />
        <button
          onClick={addRitual}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add ritual"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Tiny ritual idea
        </div>
        <p>
          {progress >= 70
            ? 'You two are building such a beautiful rhythm together. Keep the magic alive.'
            : 'A 20-minute walk, a handwritten note, or a playlist night can make today feel sacred.'}
        </p>
      </div>
    </div>
  )
}
