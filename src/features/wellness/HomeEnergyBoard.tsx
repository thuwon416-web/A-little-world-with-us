'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { House, Lightbulb, Plus, SunMedium } from 'lucide-react'

type EnergyItem = {
  id: string
  title: string
  mood: 'bright' | 'calm' | 'cozy' | 'reset'
  done: boolean
}

const starterItems: EnergyItem[] = [
  {
    id: 'energy-1',
    title: 'Open the curtains and let the room wake up',
    mood: 'bright',
    done: true,
  },
  { id: 'energy-2', title: 'Dim the lights and choose a slower pace', mood: 'calm', done: false },
  {
    id: 'energy-3',
    title: 'Make the space feel like a soft landing place',
    mood: 'cozy',
    done: true,
  },
]

const moodMeta = {
  bright: {
    label: 'bright',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  calm: {
    label: 'calm',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  cozy: {
    label: 'cozy',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  reset: {
    label: 'reset',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
} as const

const feelNotes = [
  'Turn the room into a place that helps your hearts settle.',
  'A small change in the space can change the feeling of the whole day.',
  'Choose what makes the home feel softer, brighter, and easier.',
]

export default function HomeEnergyBoard() {
  const [items, setItems] = useState<EnergyItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState<EnergyItem['mood']>('cozy')
  const [noteIndex, setNoteIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('home-energy-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
      const savedIndex = localStorage.getItem('home-energy-note')
      if (savedIndex) {
        const index = Number(savedIndex)
        if (!Number.isNaN(index) && index >= 0 && index < feelNotes.length) setNoteIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('home-energy-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('home-energy-note', String(noteIndex))
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
      { id: `home-${Date.now()}`, title: value, mood, done: false },
    ])
    setTitle('')
  }

  const rotateNote = () => {
    setNoteIndex((current) => (current + 1) % feelNotes.length)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <House className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Home Energy</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Room rhythm</span>
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
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${moodMeta[item.mood].tone}`}
              >
                {moodMeta[item.mood].label}
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
          {(['bright', 'calm', 'cozy', 'reset'] as EnergyItem['mood'][]).map((option) => (
            <button
              key={option}
              onClick={() => setMood(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === mood
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
            placeholder="Add a small home comfort cue"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add home energy cue"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[var(--accent-2)]">
            <Lightbulb className="h-4 w-4" />
            Energy note
          </div>
          <button
            onClick={rotateNote}
            className="glass-button px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          >
            Next
          </button>
        </div>
        <p className="text-sm text-[var(--text-primary)]/80">{feelNotes[noteIndex]}</p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <SunMedium className="h-4 w-4" />
          Home rhythm
        </div>
        <p>Build a home that feels like a place where both of you can exhale.</p>
      </div>
    </div>
  )
}
