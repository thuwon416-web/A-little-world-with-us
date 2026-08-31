'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Flower2, Heart, Plus, Sparkles, Sprout } from 'lucide-react'

type GardenItem = {
  id: string
  title: string
  bloom: 'seed' | 'bloom' | 'root' | 'glow'
  done: boolean
}

const starterItems: GardenItem[] = [
  {
    id: 'garden-1',
    title: 'Give one gentle thing time to grow before judging it',
    bloom: 'seed',
    done: true,
  },
  {
    id: 'garden-2',
    title: 'Let a quiet kindness arrive without needing to be rushed',
    bloom: 'root',
    done: false,
  },
  {
    id: 'garden-3',
    title: 'Let the next warm moment become a steadier kind of bloom',
    bloom: 'bloom',
    done: true,
  },
]

const bloomMeta = {
  seed: {
    label: 'seed',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  bloom: {
    label: 'bloom',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  root: {
    label: 'root',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
  glow: {
    label: 'glow',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
} as const

const prompts = [
  'What is growing quietly between us that deserves more patience?',
  'Where can we slow the pace so love has room to bloom?',
  'What gentle root helps this relationship feel steadier?',
  'Which warm little bloom should we notice before it is gone?',
]

export default function SlowGardenBoard() {
  const [items, setItems] = useState<GardenItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [bloom, setBloom] = useState<GardenItem['bloom']>('seed')
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('slow-garden-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }

      const savedPrompt = localStorage.getItem('slow-garden-prompt')
      if (savedPrompt) {
        const index = Number(savedPrompt)
        if (!Number.isNaN(index) && index >= 0 && index < prompts.length) setPromptIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('slow-garden-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('slow-garden-prompt', String(promptIndex))
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
      { id: `garden-${Date.now()}`, title: value, bloom, done: false },
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
          <Flower2 className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Slow Garden</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Garden rhythm</span>
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
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${bloomMeta[item.bloom].tone}`}
              >
                {bloomMeta[item.bloom].label}
              </span>
              <p className={`mt-2 ${item.done ? 'line-through opacity-75' : ''}`}>{item.title}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {item.done ? 'grown' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {(['seed', 'bloom', 'root', 'glow'] as GardenItem['bloom'][]).map((option) => (
            <button
              key={option}
              onClick={() => setBloom(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === bloom
                  ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]'
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
            placeholder="Add a growing cue"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add garden cue"
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
        <span>Some love grows best when it is not forced to show everything at once.</span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] p-3 text-sm text-[var(--text-secondary)]">
        <Sprout className="h-4 w-4" />
        <span>Roots of tenderness are often the strongest kind of growth.</span>
      </div>
    </div>
  )
}
