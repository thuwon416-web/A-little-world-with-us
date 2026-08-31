'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Compass, Heart, Plus, Sparkles, Star } from 'lucide-react'

type CompassItem = {
  id: string
  title: string
  direction: 'north' | 'east' | 'south' | 'west'
  done: boolean
}

const starterItems: CompassItem[] = [
  {
    id: 'compass-1',
    title: 'Choose the gentlest path when the feeling is loud',
    direction: 'north',
    done: true,
  },
  {
    id: 'compass-2',
    title: 'Keep our next step small enough to feel safe',
    direction: 'east',
    done: false,
  },
  {
    id: 'compass-3',
    title: 'Let warmth lead the way when we are unsure',
    direction: 'south',
    done: true,
  },
]

const directionMeta = {
  north: {
    label: 'north',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  east: {
    label: 'east',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  south: {
    label: 'south',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  west: {
    label: 'west',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
} as const

const prompts = [
  'Which direction keeps us feeling closest to each other right now?',
  'What gentle choice helps both of us feel more steady together?',
  'Where do we need more softness, trust, or room to breathe?',
  'What small compass point could turn today into a gentler ending?',
]

export default function TenderCompassBoard() {
  const [items, setItems] = useState<CompassItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [direction, setDirection] = useState<CompassItem['direction']>('north')
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tender-compass-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }

      const savedPrompt = localStorage.getItem('tender-compass-prompt')
      if (savedPrompt) {
        const index = Number(savedPrompt)
        if (!Number.isNaN(index) && index >= 0 && index < prompts.length) setPromptIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tender-compass-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('tender-compass-prompt', String(promptIndex))
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
      { id: `compass-${Date.now()}`, title: value, direction, done: false },
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
          <Compass className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Tender Compass</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Compass progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--card-bg-strong)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--accent-1)]"
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
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${directionMeta[item.direction].tone}`}
              >
                {directionMeta[item.direction].label}
              </span>
              <p className={`mt-2 ${item.done ? 'line-through opacity-75' : ''}`}>{item.title}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {item.done ? 'aligned' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {(['north', 'east', 'south', 'west'] as CompassItem['direction'][]).map((option) => (
            <button
              key={option}
              onClick={() => setDirection(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === direction
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
            placeholder="Add a bearing of care"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add compass direction"
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

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/30 bg-[var(--bg-2)] p-3 text-sm text-[var(--accent-1)]">
        <Heart className="h-4 w-4" />
        <span>Love is not a straight line; it is a direction chosen kindly, again and again.</span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] p-3 text-sm text-[var(--accent-1)]">
        <Star className="h-4 w-4" />
        <span>Let the next move be one that keeps both hearts feeling safely seen.</span>
      </div>
    </div>
  )
}
