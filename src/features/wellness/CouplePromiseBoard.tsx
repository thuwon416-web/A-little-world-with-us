'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Heart, Plus, Sparkles, Wand2 } from 'lucide-react'

type PromiseItem = {
  id: string
  label: string
  done: boolean
}

type DreamDateIdea = {
  title: string
  detail: string
  mood: string[]
}

const starterPromises: PromiseItem[] = [
  { id: 'promise-1', label: 'No phones at dinner tonight', done: true },
  { id: 'promise-2', label: 'Tell each other one genuine appreciation', done: false },
  { id: 'promise-3', label: 'Keep the evening slow and easy', done: true },
]

const dreamDates: DreamDateIdea[] = [
  {
    title: 'Moonlit Picnic',
    detail:
      'Pack a blanket, warm drinks, and let the evening become a little slower and softer than usual.',
    mood: ['cozy', 'soft', 'romantic'],
  },
  {
    title: 'Hidden Cafe Date',
    detail:
      'Find a tiny neighborhood place with good music and stay way longer than the plan allows.',
    mood: ['playful', 'easy', 'quiet'],
  },
  {
    title: 'Sunset Photo Walk',
    detail:
      'Take a few minutes to wander, laugh, and notice all the tiny details in the world around you.',
    mood: ['adventurous', 'sweet', 'present'],
  },
  {
    title: 'At-Home Cinema Night',
    detail:
      'Make the blanket nest, choose a comfort movie, and make the room feel like a tiny planet of love.',
    mood: ['cozy', 'gentle', 'unhurried'],
  },
]

export default function CouplePromiseBoard() {
  const [promises, setPromises] = useState<PromiseItem[]>(starterPromises)
  const [draft, setDraft] = useState('')
  const [dateIndex, setDateIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('couple-promise-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setPromises(parsed)
      }
      const savedIndex = localStorage.getItem('couple-dream-date-index')
      if (savedIndex) {
        const index = Number(savedIndex)
        if (!Number.isNaN(index) && index >= 0 && index < dreamDates.length) setDateIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('couple-promise-board', JSON.stringify(promises))
  }, [promises])

  useEffect(() => {
    localStorage.setItem('couple-dream-date-index', String(dateIndex))
  }, [dateIndex])

  const doneCount = useMemo(() => promises.filter((item) => item.done).length, [promises])
  const progress = promises.length ? Math.round((doneCount / promises.length) * 100) : 0
  const currentDate = dreamDates[dateIndex] ?? dreamDates[0] ?? null

  if (!currentDate) {
    return null
  }

  const togglePromise = (id: string) => {
    setPromises((current) =>
      current.map((promise) => (promise.id === id ? { ...promise, done: !promise.done } : promise))
    )
  }

  const addPromise = () => {
    const value = draft.trim()
    if (!value) return

    setPromises((current) => [
      ...current,
      { id: `promise-${Date.now()}`, label: value, done: false },
    ])
    setDraft('')
  }

  const shuffleIdea = () => {
    setDateIndex((current) => (current + 1) % dreamDates.length)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Heart className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Promise Board</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{promises.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Shared promises</span>
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
        {promises.map((promise) => (
          <motion.button
            key={promise.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => togglePromise(promise.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
              promise.done
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-primary)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            <span>{promise.label}</span>
            <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]">
              {promise.done ? <Check className="h-3 w-3" /> : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a promise to keep"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button
          onClick={addPromise}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add promise"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[var(--accent-2)]">
            <Sparkles className="h-4 w-4" />
            Dream date idea
          </div>
          <button
            onClick={shuffleIdea}
            className="glass-button px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          >
            <Wand2 className="mr-1 inline h-3 w-3" />
            Shuffle
          </button>
        </div>
        <div className="font-dancing text-2xl text-[var(--text-primary)]">{currentDate.title}</div>
        <p className="mt-1 leading-relaxed">{currentDate.detail}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {currentDate.mood.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--card-bg-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--accent-1)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
