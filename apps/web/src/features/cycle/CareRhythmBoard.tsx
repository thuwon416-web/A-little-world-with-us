'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { HeartPulse, Plus, Sparkles } from 'lucide-react'

type RhythmItem = { id: string; label: string; done: boolean }

const starterItems: RhythmItem[] = [
  { id: 'r1', label: 'Morning check-in', done: true },
  { id: 'r2', label: 'Drink water + breathe', done: false },
  { id: 'r3', label: 'Stretch and reset', done: true },
  { id: 'r4', label: 'Share one kind thought', done: false },
]

export default function CareRhythmBoard() {
  const [items, setItems] = useState<RhythmItem[]>(starterItems)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('care-rhythm-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { localStorage.setItem('care-rhythm-board', JSON.stringify(items)) }, [items])

  const doneCount = useMemo(() => items.filter(item => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => setItems(current => current.map(item => item.id === id ? { ...item, done: !item.done } : item))
  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    setItems(current => [...current, { id: `rhythm-${Date.now()}`, label: value, done: false }])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-accent-2">
          <HeartPulse className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Care Rhythm Board</h3>
        </div>
        <div className="rounded-full border border-accent-1/20 bg-accent-2/20 px-2 py-1 text-[10px] font-medium text-text-2">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-btn border border-accent-1/20 bg-card p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-text-1/60">
          <span>Daily rhythm</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-card">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-1 to-accent-2"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleItem(item.id)}
            className={`flex w-full items-center justify-between rounded-btn border px-3 py-2 text-left text-sm transition ${
              item.done
                ? 'border-accent-1/20 bg-accent-2/20 text-text-1'
                : 'border-accent-1/20 bg-card/25 text-text-1/80'
            }`}
          >
            <span>{item.label}</span>
            <span className="text-[9px] uppercase tracking-[0.18em]">{item.done ? 'done' : 'later'}</span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a care habit"
          className="glass-input w-full rounded-btn px-3 py-2 text-sm text-text-1 placeholder:text-text-1/40"
        />
        <button onClick={addItem} className="glass-button px-3 py-2 text-sm" aria-label="Add care rhythm item">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-btn border border-accent-1/20 bg-gradient-to-r from-accent-2 to-accent-1 p-3 text-sm text-text-1/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-accent-2">
          <Sparkles className="h-4 w-4" />
          Gentle note
        </div>
        <p>Care is not a performance. It is a rhythm of being gentle with yourself and each other.</p>
      </div>
    </div>
  )
}
