'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircleHeart, Plus } from 'lucide-react'

type CheckInItem = {
  id: string
  text: string
  kind: 'need' | 'offer' | 'ritual'
  done: boolean
}

const starterItems: CheckInItem[] = [
  { id: 'need-1', text: 'I need a softer evening today', kind: 'need', done: true },
  { id: 'offer-1', text: 'I can bring tea and a slow conversation', kind: 'offer', done: false },
  { id: 'ritual-1', text: 'A 10-minute cuddle and no phone check-in', kind: 'ritual', done: true },
]

const kindMeta = {
  need: {
    label: 'need',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  offer: {
    label: 'offer',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  ritual: {
    label: 'ritual',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
} as const

export default function LoveCheckInBoard() {
  const [items, setItems] = useState<CheckInItem[]>(starterItems)
  const [draft, setDraft] = useState('')
  const [kind, setKind] = useState<CheckInItem['kind']>('need')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('love-checkin-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('love-checkin-board', JSON.stringify(items))
  }, [items])

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const addItem = () => {
    const value = draft.trim()
    if (!value) return

    setItems((current) => [
      ...current,
      { id: `checkin-${Date.now()}`, text: value, kind, done: false },
    ])
    setDraft('')
  }

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <MessageCircleHeart className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Love Check-In</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Check-in rhythm</span>
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
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleItem(item.id)}
            className="flex w-full items-start justify-between gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3 text-left text-sm text-[var(--text-primary)]/80 transition hover:border-[var(--accent-1)]/30"
          >
            <div className="flex-1">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${kindMeta[item.kind].tone}`}
              >
                {kindMeta[item.kind].label}
              </span>
              <p className={`mt-2 ${item.done ? 'line-through opacity-75' : ''}`}>{item.text}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {item.done ? 'done' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2">
          {(['need', 'offer', 'ritual'] as CheckInItem['kind'][]).map((option) => (
            <button
              key={option}
              onClick={() => setKind(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === kind
                  ? 'border-[var(--accent-1)]/20 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                  : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)]/70'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share a need, offer, or ritual"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add check-in item"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Heart className="h-4 w-4" />
          Gentle reminder
        </div>
        <p>
          Check-ins work best when they are soft, honest, and kind. A small need is still a real
          one.
        </p>
      </div>
    </div>
  )
}
