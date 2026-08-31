'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownToLine, Heart, MoonStar, Plus, Sparkles } from 'lucide-react'

type ReentryItem = {
  id: string
  title: string
  mode: 'land' | 'reset' | 'refill'
  done: boolean
}

const starterItems: ReentryItem[] = [
  {
    id: 'reentry-1',
    title: 'Take ten quiet minutes before talking about the day',
    mode: 'land',
    done: true,
  },
  {
    id: 'reentry-2',
    title: 'Put the phones away and let the room soften',
    mode: 'reset',
    done: false,
  },
  { id: 'reentry-3', title: 'Share one thing that still feels warm', mode: 'refill', done: true },
]

const modeMeta = {
  land: {
    label: 'land',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  reset: {
    label: 'reset',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
  refill: {
    label: 'refill',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
} as const

const gentleNotes = [
  'You are not required to fix the whole day in one conversation.',
  'A soft landing is part of love, not a distraction from it.',
  'A slower reentry often makes closeness feel more real.',
]

export default function CozyReentryBoard() {
  const [items, setItems] = useState<ReentryItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<ReentryItem['mode']>('land')
  const [noteIndex, setNoteIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cozy-reentry-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
      const savedNote = localStorage.getItem('cozy-reentry-note')
      if (savedNote) {
        const index = Number(savedNote)
        if (!Number.isNaN(index) && index >= 0 && index < gentleNotes.length) setNoteIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cozy-reentry-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('cozy-reentry-note', String(noteIndex))
  }, [noteIndex])

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const addItem = () => {
    const value = title.trim()
    if (!value) return

    setItems((current) => [
      ...current,
      { id: `reentry-${Date.now()}`, title: value, mode, done: false },
    ])
    setTitle('')
  }

  const rotateNote = () => {
    setNoteIndex((current) => (current + 1) % gentleNotes.length)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <ArrowDownToLine className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Cozy Reentry</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Landing rhythm</span>
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
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${modeMeta[item.mode].tone}`}
              >
                {modeMeta[item.mode].label}
              </span>
              <p className={`mt-2 ${item.done ? 'line-through opacity-75' : ''}`}>{item.title}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {item.done ? 'done' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {(['land', 'reset', 'refill'] as ReentryItem['mode'][]).map((option) => (
            <button
              key={option}
              onClick={() => setMode(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === mode
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
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a soft landing ritual"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add reentry ritual"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[var(--accent-2)]">
            <Sparkles className="h-4 w-4" />
            Soft note
          </div>
          <button
            onClick={rotateNote}
            className="glass-button px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          >
            Next
          </button>
        </div>
        <p className="text-sm text-[var(--text-primary)]/80">{gentleNotes[noteIndex]}</p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <MoonStar className="h-4 w-4" />
          Reentry reminder
        </div>
        <p>Let the room become softer before the conversation becomes heavier.</p>
      </div>
    </div>
  )
}
