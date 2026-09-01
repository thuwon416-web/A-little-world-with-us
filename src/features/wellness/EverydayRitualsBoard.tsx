'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock3, MoonStar, Plus, Sparkles } from 'lucide-react'

type RitualItem = {
  id: string
  title: string
  kind: 'morning' | 'midday' | 'evening' | 'reset'
  done: boolean
}

const starterRituals: RitualItem[] = [
  { id: 'ritual-m1', title: 'Message each other a soft good morning', kind: 'morning', done: true },
  {
    id: 'ritual-d1',
    title: 'Take one slow breath before checking messages',
    kind: 'reset',
    done: false,
  },
  { id: 'ritual-e1', title: 'End the day with a gratitude note', kind: 'evening', done: true },
]

const kindMeta = {
  morning: {
    label: 'morning',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  midday: {
    label: 'midday',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  evening: {
    label: 'evening',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  reset: {
    label: 'reset',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
} as const

const warmPrompts = [
  'What felt gentle today?',
  'What do you want more of tomorrow?',
  'What made you feel the most loved?',
  'What can we protect from stress?',
]

export default function EverydayRitualsBoard() {
  const [rituals, setRituals] = useState<RitualItem[]>(starterRituals)
  const [draftTitle, setDraftTitle] = useState('')
  const [kind, setKind] = useState<RitualItem['kind']>('morning')
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('everyday-rituals-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setRituals(parsed)
      }
      const savedPrompt = localStorage.getItem('everyday-rituals-prompt')
      if (savedPrompt) {
        const index = Number(savedPrompt)
        if (!Number.isNaN(index) && index >= 0 && index < warmPrompts.length) setPromptIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('everyday-rituals-board', JSON.stringify(rituals))
  }, [rituals])

  useEffect(() => {
    localStorage.setItem('everyday-rituals-prompt', String(promptIndex))
  }, [promptIndex])

  const doneCount = useMemo(() => rituals.filter((ritual) => ritual.done).length, [rituals])
  const progress = rituals.length ? Math.round((doneCount / rituals.length) * 100) : 0

  const toggleRitual = (id: string) => {
    setRituals((current) =>
      current.map((ritual) => (ritual.id === id ? { ...ritual, done: !ritual.done } : ritual))
    )
  }

  const addRitual = () => {
    const value = draftTitle.trim()
    if (!value) return

    setRituals((current) => [
      ...current,
      { id: `ritual-${Date.now()}`, title: value, kind, done: false },
    ])
    setDraftTitle('')
  }

  const rotatePrompt = () => {
    setPromptIndex((current) => (current + 1) % warmPrompts.length)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Clock3 className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Everyday Rituals</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{rituals.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Daily rhythm</span>
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
            className="flex w-full items-start justify-between gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3 text-left text-sm text-[var(--text-primary)]/80 transition hover:border-[var(--accent-1)]/30"
          >
            <div className="flex-1">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${kindMeta[ritual.kind].tone}`}
              >
                {kindMeta[ritual.kind].label}
              </span>
              <p className={`mt-2 ${ritual.done ? 'line-through opacity-75' : ''}`}>
                {ritual.title}
              </p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {ritual.done ? 'done' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {(['morning', 'midday', 'evening', 'reset'] as RitualItem['kind'][]).map((option) => (
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
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            placeholder="Add a daily ritual"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addRitual}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add ritual"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[var(--accent-2)]">
            <Sparkles className="h-4 w-4" />
            Gentle prompt
          </div>
          <button
            onClick={rotatePrompt}
            className="glass-button px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          >
            Next
          </button>
        </div>
        <p className="text-sm text-[var(--text-primary)]/80">{warmPrompts[promptIndex]}</p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <MoonStar className="h-4 w-4" />
          Soft reset
        </div>
        <p>If the day gets loud, return to the smallest ritual that feels safe and easy.</p>
      </div>
    </div>
  )
}
