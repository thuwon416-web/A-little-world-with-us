'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LockKeyhole, Plus, Sparkles } from 'lucide-react'

type Letter = {
  id: string
  title: string
  content: string
  unlocked: boolean
}

const starterLetters: Letter[] = [
  { id: 'l1', title: 'For the hard days', content: 'You are still my Safe Place.', unlocked: true },
  {
    id: 'l2',
    title: 'For the good days',
    content: 'I hope you feel how deeply I cherish you.',
    unlocked: false,
  },
]

export default function SecretLetterTray() {
  const [letters, setLetters] = useState<Letter[]>(starterLetters)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('secret-letter-tray')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setLetters(parsed)
        }
      }
    } catch {
      // ignore gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('secret-letter-tray', JSON.stringify(letters))
  }, [letters])

  const toggleUnlock = (id: string) => {
    setLetters((current) =>
      current.map((letter) =>
        letter.id === id ? { ...letter, unlocked: !letter.unlocked } : letter
      )
    )
  }

  const addLetter = () => {
    const titleValue = title.trim()
    const contentValue = content.trim()
    if (!titleValue || !contentValue) return

    setLetters((current) => [
      ...current,
      { id: `letter-${Date.now()}`, title: titleValue, content: contentValue, unlocked: false },
    ])
    setTitle('')
    setContent('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <LockKeyhole className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Secret Letter Tray</h3>
      </div>

      <div className="space-y-2">
        {letters.map((letter) => (
          <motion.button
            key={letter.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleUnlock(letter.id)}
            className={`w-full rounded-2xl border p-3 text-left transition ${
              letter.unlocked
                ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--text-primary)]">{letter.title}</span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
                {letter.unlocked ? 'open' : 'locked'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-primary)]/75">
              {letter.unlocked ? letter.content : 'This letter is waiting for the right moment.'}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Letter title"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="Write a private note..."
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button onClick={addLetter} className="glass-button px-3 py-2 text-sm w-full">
          <Plus className="h-4 w-4 mr-1 inline-block" />
          Add letter
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Quiet promise
        </div>
        <p>Some love is best kept close, saved for the times your heart needs a soft reminder.</p>
      </div>
    </div>
  )
}
