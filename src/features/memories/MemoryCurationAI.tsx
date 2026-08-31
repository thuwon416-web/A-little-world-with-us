'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'

const templates = {
  trip: 'The Story of Our First Trip — a portrait of nervous laughter, bright sunlight, and the feeling that the world suddenly felt smaller and softer when you were beside me.',
  year: '2025: Our Year in Words — a gentle summary of how we grew, slipped into each other’s rituals, and made ordinary days feel like a painting.',
  home: 'How We Built Our Home — the little things that became rituals: the playlists, the morning coffee, the way we made even the quietest nights feel warm.',
  future:
    'Where We’re Going Next — the dreams, promises, and beautifully uncertain plans that make love feel like a long adventure with a home at the end of it.',
}

export default function MemoryCurationAI() {
  const [theme, setTheme] = useState<keyof typeof templates>('trip')
  const [story, setStory] = useState(templates.trip)

  const themes = useMemo(
    () => [
      { key: 'trip', label: 'First trip' },
      { key: 'year', label: 'Year recap' },
      { key: 'home', label: 'Our home' },
      { key: 'future', label: 'Future dreams' },
    ],
    []
  )

  const generateStory = (nextTheme: keyof typeof templates) => {
    setTheme(nextTheme)
    setStory(templates[nextTheme])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Wand2 className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Memory Curation AI</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {themes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => generateStory(key as keyof typeof templates)}
            className={`rounded-full px-3 py-2 text-[11px] ${
              theme === key
                ? 'bg-[var(--accent-1)] text-[var(--text-primary)] shadow-md'
                : 'bg-[var(--card-bg)]/35 text-[var(--text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <motion.div layout className="glass-card rounded-2xl p-3">
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent-1)] mb-2">
          Suggested story
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-primary)]/80">{story}</p>
      </motion.div>
    </div>
  )
}
