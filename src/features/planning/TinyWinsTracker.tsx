'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Plus, Sparkles, Star } from 'lucide-react'

type Win = {
  id: string
  label: string
  done: boolean
}

const starterWins: Win[] = [
  { id: 'w1', label: 'Shared a real laugh', done: true },
  { id: 'w2', label: 'Went on a surprise date', done: false },
  { id: 'w3', label: 'Said something kind', done: true },
  { id: 'w4', label: 'Made a future plan together', done: false },
]

export default function TinyWinsTracker() {
  const [wins, setWins] = useState<Win[]>(starterWins)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tiny-wins-tracker')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setWins(parsed)
        }
      }
    } catch {
      // ignore gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tiny-wins-tracker', JSON.stringify(wins))
  }, [wins])

  const doneCount = useMemo(() => wins.filter((win) => win.done).length, [wins])
  const ratio = wins.length ? Math.round((doneCount / wins.length) * 100) : 0

  const toggleWin = (id: string) => {
    setWins((current) => current.map((win) => (win.id === id ? { ...win, done: !win.done } : win)))
  }

  const addWin = () => {
    const value = draft.trim()
    if (!value) return
    setWins((current) => [...current, { id: `win-${Date.now()}`, label: value, done: false }])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Star className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Tiny Wins Tracker</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {doneCount}/{wins.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Progress</span>
          <span>{ratio}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--card-bg-strong)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--accent-2)]"
            initial={{ width: 0 }}
            animate={{ width: `${ratio}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {wins.map((win) => (
          <motion.button
            key={win.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleWin(win.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
              win.done
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-primary)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className={`h-4 w-4 ${win.done ? 'fill-current' : ''}`} />
              {win.label}
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em]">
              {win.done ? 'done' : 'todo'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a tiny win"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40 outline-none"
        />
        <button
          onClick={addWin}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add tiny win"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Kind reminder
        </div>
        <p>Small joys count. The way you choose each other every day is the real romance.</p>
      </div>
    </div>
  )
}
