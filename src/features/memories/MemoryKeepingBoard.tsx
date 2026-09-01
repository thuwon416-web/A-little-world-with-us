'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookHeart, Heart, Plus, Sparkles } from 'lucide-react'

type MemoryItem = {
  id: string
  title: string
  kind: 'favorite' | 'ritual' | 'moments' | 'reflection'
  done: boolean
}

const starterItems: MemoryItem[] = [
  { id: 'memory-1', title: 'The way your laugh changes the room', kind: 'favorite', done: true },
  { id: 'memory-2', title: 'A slow walk with no destination', kind: 'moments', done: false },
  { id: 'memory-3', title: 'A night when everything felt easy', kind: 'reflection', done: true },
]

const kindMeta = {
  favorite: {
    label: 'favorite',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  ritual: {
    label: 'ritual',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]',
  },
  moments: {
    label: 'moments',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
  reflection: {
    label: 'reflection',
    tone: 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--text-secondary)]',
  },
} as const

const prompts = [
  'What moment do you want to keep returning to?',
  'Which habit makes this love feel easy to carry?',
  'What small detail feels unforgettable now?',
  'What do you want to remember when life feels noisy?',
]

export default function MemoryKeepingBoard() {
  const [items, setItems] = useState<MemoryItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<MemoryItem['kind']>('favorite')
  const [promptIndex, setPromptIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('memory-keeping-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
      const savedPrompt = localStorage.getItem('memory-keeping-prompt')
      if (savedPrompt) {
        const index = Number(savedPrompt)
        if (!Number.isNaN(index) && index >= 0 && index < prompts.length) setPromptIndex(index)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('memory-keeping-board', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('memory-keeping-prompt', String(promptIndex))
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
      { id: `memory-${Date.now()}`, title: value, kind, done: false },
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
          <BookHeart className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Memory Keeping</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{items.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Memory rhythm</span>
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
          {(['favorite', 'ritual', 'moments', 'reflection'] as MemoryItem['kind'][]).map(
            (option) => (
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
            )
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a memory to keep close"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button
            onClick={addItem}
            className="glass-button px-3 py-2 text-sm"
            aria-label="Add memory note"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-[var(--accent-2)]">
            <Sparkles className="h-4 w-4" />
            Memory prompt
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
          <Heart className="h-4 w-4" />
          Remember this
        </div>
        <p>The best memories are usually the ones that felt quiet, ordinary, and deeply loved.</p>
      </div>
    </div>
  )
}
