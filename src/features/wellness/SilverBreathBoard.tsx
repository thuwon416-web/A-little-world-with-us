'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Plus, Sparkles, Wind } from 'lucide-react'

type BreathItem = {
  id: string
  title: string
  mood: 'inhale' | 'pause' | 'exhale' | 'steady'
  done: boolean
}

const starterItems: BreathItem[] = [
  {
    id: 'silver-1',
    title: 'Let the next inhale carry less urgency and more trust',
    mood: 'inhale',
    done: true,
  },
  {
    id: 'silver-2',
    title: 'A brief pause can soften the room before words arrive',
    mood: 'pause',
    done: false,
  },
  {
    id: 'silver-3',
    title: 'Exhale into the version of us that feels safest together',
    mood: 'exhale',
    done: true,
  },
]

const moodMeta = {
  inhale: {
    label: 'inhale',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  pause: {
    label: 'pause',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  exhale: {
    label: 'exhale',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  steady: {
    label: 'steady',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
  },
} as const

const prompts = [
  'What breath structure helps us soften without becoming distant?',
  'Where can a pause replace urgency with gentleness?',
  'Which exhale would carry more trust and less pressure?',
  'What steady rhythm makes the next moment feel safer and kinder?',
]

export default function SilverBreathBoard() {
  const [items, setItems] = useState<BreathItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState<BreathItem['mood']>('inhale')
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('silver-breath-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }

      const savedPrompt = localStorage.getItem('silver-breath-prompt')
      if (savedPrompt) {
        const index = Number(savedPrompt)
        if (!Number.isNaN(index) && index >= 0 && index < prompts.length) setPromptIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('silver-breath-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('silver-breath-prompt', String(promptIndex))
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
      { id: `silver-${Date.now()}`, title: value, mood, done: false },
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
          <Wind className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Silver Breath</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Breath flow</span>
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
                className={`inline-block rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${moodMeta[item.mood].tone}`}
              >
                {moodMeta[item.mood].label}
              </span>
              <p className={`mt-2 ${item.done ? 'line-through opacity-75' : ''}`}>{item.title}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {item.done ? 'settled' : 'later'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {(['inhale', 'pause', 'exhale', 'steady'] as BreathItem['mood'][]).map((option) => (
            <button
              key={option}
              onClick={() => setMood(option)}
              className={`flex-1 rounded-xl border px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition ${
                option === mood
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
            placeholder="Add a breath cue"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add breath cue"
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
        <span>Gentle breathing can quiet the loudest parts of the day.</span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] p-3 text-sm text-[var(--text-secondary)]">
        <Wind className="h-4 w-4" />
        <span>Even a slow breath can carry more tenderness than a hurried sentence.</span>
      </div>
    </div>
  )
}
