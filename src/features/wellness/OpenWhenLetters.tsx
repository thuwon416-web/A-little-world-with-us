'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Mailbox, Heart, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

type Letter = {
  id: string
  title: string
  hint: string
  content: string
  opened: boolean
}

const defaultLetters: Letter[] = [
  {
    id: 'sad',
    title: 'Open when you are sad',
    hint: 'For the days the world feels heavy.',
    content:
      'Even on the hardest days, remember: my love for you is not a mood, it is a steady home. You are still deeply loved, even when everything feels loud.',
    opened: false,
  },
  {
    id: 'miss-you',
    title: 'Open when you miss me',
    hint: 'When your heart reaches for my side.',
    content:
      'I am missing you in the same quiet way the moon misses the sun. You are always carried in my thoughts, and my love for you does not depend on distance.',
    opened: false,
  },
  {
    id: 'fight',
    title: 'Open when we fight',
    hint: 'When the air feels sharp and the silence hurts.',
    content:
      'We are still us, even in the mess. We are allowed to be imperfect and still choose each other with softness. I love you more than the conflict, and I want us to come back gently.',
    opened: false,
  },
]

export default function OpenWhenLetters() {
  const [letters, setLetters] = useState<Letter[]>(defaultLetters)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('a-little-world-with-us-letters')
    if (stored) setLetters(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('a-little-world-with-us-letters', JSON.stringify(letters))
  }, [letters])

  const toggleLetter = (id: string) => {
    setLetters((prev) =>
      prev.map((letter) => (letter.id === id ? { ...letter, opened: !letter.opened } : letter))
    )
    setActiveId(id)
  }

  const activeLetter = letters.find((letter) => letter.id === activeId) ?? letters[0] ?? null

  if (!activeLetter) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Mailbox className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Open When Letters</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {letters.map((letter) => (
          <motion.button
            key={letter.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleLetter(letter.id)}
            className={`relative overflow-hidden rounded-3xl border p-3 text-left ${
              letter.opened
                ? 'border-[var(--accent-1)]/40 bg-[var(--accent-1)]/10'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25'
            }`}
          >
            <div className="absolute inset-x-4 top-2 h-6 rounded-b-2xl bg-[var(--card-bg)]" />
            <div className="relative">
              <div className="mb-2 flex items-center gap-2 text-[var(--accent-1)]">
                <Heart className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.2em]">Letter</span>
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{letter.title}</div>
              <p className="mt-2 text-[11px] opacity-70">{letter.hint}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeLetter.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass-card rounded-3xl p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-[var(--accent-1)]">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-[0.2em]">{activeLetter.title}</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]/80">
            {activeLetter.content}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
