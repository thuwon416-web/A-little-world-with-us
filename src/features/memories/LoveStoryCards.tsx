'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookHeart, Sparkles } from 'lucide-react'

type StoryCard = {
  id: string
  title: string
  summary: string
  mood: 'sweet' | 'adventurous' | 'quiet' | 'deep'
}

const starterStories: StoryCard[] = [
  {
    id: 's1',
    title: 'The first time we laughed too hard',
    summary: 'We were still learning each other, and somehow it felt like home already.',
    mood: 'sweet',
  },
  {
    id: 's2',
    title: 'The night we stayed out too long',
    summary: 'We wandered until the world became softer and the silence felt full.',
    mood: 'quiet',
  },
  {
    id: 's3',
    title: 'The trip we almost planned',
    summary: 'We imagined the road, the songs, and the way it would feel to be together there.',
    mood: 'adventurous',
  },
]

const moodColors: Record<StoryCard['mood'], string> = {
  sweet: 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]',
  adventurous: 'bg-[var(--bg-2)] text-[var(--accent-1)]',
  quiet: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
  deep: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
}

export default function LoveStoryCards() {
  const [stories] = useState(starterStories)
  const [activeId, setActiveId] = useState(starterStories[0]?.id ?? '')

  const activeStory = useMemo(
    () => stories.find((story) => story.id === activeId) ?? stories[0] ?? null,
    [activeId, stories]
  )

  if (!activeStory) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <BookHeart className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Story Cards</h3>
      </div>

      <div className="grid gap-3">
        {stories.map((story) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveId(story.id)}
            className={`rounded-2xl border p-3 text-left transition ${
              activeId === story.id
                ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--text-primary)]">{story.title}</span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.15em] ${moodColors[story.mood]}`}
              >
                {story.mood}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-primary)]/75">{story.summary}</p>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Highlighted chapter
        </div>
        <p>{activeStory.summary}</p>
      </div>
    </div>
  )
}
