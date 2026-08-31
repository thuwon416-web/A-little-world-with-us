'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MoonStar, Plus, Sparkles, Star, Wind } from 'lucide-react'

type BloomItem = {
  id: string
  title: string
  tone: 'gentle' | 'warm' | 'bright' | 'steady'
  done: boolean
}

const starterItems: BloomItem[] = [
  {
    id: 'bloom-1',
    title: 'Hold one small kindness without needing a grand gesture',
    tone: 'gentle',
    done: true,
  },
  {
    id: 'bloom-2',
    title: 'Let appreciation arrive as softly as a morning light',
    tone: 'warm',
    done: false,
  },
  {
    id: 'bloom-3',
    title: 'Keep the next step simple enough to tend with care',
    tone: 'steady',
    done: true,
  },
]

const toneMeta = {
  gentle: {
    label: 'gentle',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  warm: {
    label: 'warm',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  bright: {
    label: 'bright',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  steady: {
    label: 'steady',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
} as const

const prompts = [
  'What small act of care can grow in the next few hours?',
  'Where can we make room for softness instead of speed?',
  'What gentle rhythm helps both of us feel more at ease?',
  'What tiny bright thing deserves to be noticed today?',
]

export default function QuietBloomBoard() {
  const [items, setItems] = useState<BloomItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [tone, setTone] = useState<BloomItem['tone']>('gentle')
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('quiet-bloom-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }

      const savedPrompt = localStorage.getItem('quiet-bloom-prompt')
      if (savedPrompt) {
        const index = Number(savedPrompt)
        if (!Number.isNaN(index) && index >= 0 && index < prompts.length) setPromptIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('quiet-bloom-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('quiet-bloom-prompt', String(promptIndex))
  }, [promptIndex])

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
      { id: `bloom-${Date.now()}`, title: value, tone, done: false },
    ])
    setTitle('')
  }

  const rotatePrompt = () => {
    setPromptIndex((current) => (current + 1) % prompts.length)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <MoonStar className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Quiet Bloom</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Bloom progress</span>
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
            className="flex w-full items-start justify-between gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3 text-left text-sm text-[var(--text-primary)]/80 transition hover:border-[var(--accent-1)]/20"
          >
            <div className="flex-1">
              <span
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${toneMeta[item.tone].tone}`}
              >
                {toneMeta[item.tone].label}
              </span>
              <p className={`mt-2 ${item.done ? 'line-through opacity-75' : ''}`}>{item.title}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {item.done ? 'tended' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {(['gentle', 'warm', 'bright', 'steady'] as BloomItem['tone'][]).map((option) => (
            <button
              key={option}
              onClick={() => setTone(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === tone
                  ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]'
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
            placeholder="Add a small bloom cue"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add bloom cue"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-1)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[var(--accent-2)]">
            <Sparkles className="h-4 w-4" />
            Prompt
          </div>
          <button
            onClick={rotatePrompt}
            className="glass-button px-2 py-1 text-[10px] uppercase tracking-[0.18em]"
          >
            Next
          </button>
        </div>
        <p className="text-sm text-[var(--text-primary)]/80">{prompts[promptIndex]}</p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Wind className="h-4 w-4" />
          Gentle note
        </div>
        <p>Some care grows best in the quiet, when it is not trying to impress the whole world.</p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/30 bg-[var(--bg-2)] p-3 text-sm text-[var(--accent-1)]">
        <Star className="h-4 w-4" />
        <span>Let a small tenderness become a steady kind of home.</span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] p-3 text-sm text-[var(--accent-1)]">
        <Heart className="h-4 w-4" />
        <span>Quiet blooms are still love, just unfolding with patience.</span>
      </div>
    </div>
  )
}
