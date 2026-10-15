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
  sweet: 'bg-accent-1/20 text-accent-1',
  adventurous: 'bg-soft-tint text-accent-1',
  quiet: 'bg-soft-tint text-text-2',
  deep: 'bg-soft-tint text-text-2',
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
      <div className="flex items-center gap-2 text-accent-2">
        <BookHeart className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Story Cards</h3>
      </div>

      <div className="grid gap-3">
        {stories.map((story) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveId(story.id)}
            className={`rounded-btn border p-3 text-left transition ${
              activeId === story.id
                ? 'border-accent-1/20 bg-soft-tint'
                : 'border-accent-1/20 bg-card/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-text-1">{story.title}</span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.15em] ${moodColors[story.mood]}`}
              >
                {story.mood}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-1/75">{story.summary}</p>
          </motion.button>
        ))}
      </div>

      <div className="rounded-btn border border-accent-1/30 bg-card p-3 text-sm text-text-1">
        <div className="mb-1 flex items-center gap-2 font-medium text-accent-2">
          <Sparkles className="h-4 w-4" />
          Highlighted chapter
        </div>
        <p>{activeStory.summary}</p>
      </div>
    </div>
  )
}
