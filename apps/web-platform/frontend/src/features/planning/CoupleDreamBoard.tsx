'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Globe2, MapPin, Plus, Sparkles, Star } from 'lucide-react'

type DreamItem = {
  id: string
  label: string
  done: boolean
  category: 'Date' | 'Travel' | 'Home' | 'Dream'
}

const starterDreams: DreamItem[] = [
  { id: 'beach-sunset', label: 'Beach sunset dinner', done: true, category: 'Date' },
  { id: 'cottage-weekend', label: 'Cottage weekend getaway', done: false, category: 'Travel' },
  { id: 'home-library', label: 'Build a cozy reading nook', done: false, category: 'Home' },
  { id: 'star-lab', label: 'Watch the stars from a hilltop', done: false, category: 'Dream' },
]

const dateIdeas = [
  'Picnic under the lights',
  'Slow bakery breakfast',
  'Full moon walk + dessert',
  'DIY movie night at home',
  'Hidden garden date',
]

export default function CoupleDreamBoard() {
  const [dreams, setDreams] = useState<DreamItem[]>(starterDreams)
  const [draft, setDraft] = useState('')
  const [selectedIdea, setSelectedIdea] = useState(dateIdeas[0] ?? '')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('couple-dream-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setDreams(parsed)
        }
      }
      const idea = localStorage.getItem('couple-date-idea')
      if (idea) setSelectedIdea(idea)
    } catch {
      // ignore localStorage failures gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('couple-dream-board', JSON.stringify(dreams))
  }, [dreams])

  useEffect(() => {
    localStorage.setItem('couple-date-idea', selectedIdea)
  }, [selectedIdea])

  const progress = useMemo(() => {
    if (!dreams.length) return 0
    return Math.round((dreams.filter((dream) => dream.done).length / dreams.length) * 100)
  }, [dreams])

  const toggleDream = (id: string) => {
    setDreams((current) =>
      current.map((dream) => (dream.id === id ? { ...dream, done: !dream.done } : dream))
    )
  }

  const addDream = () => {
    const value = draft.trim()
    if (!value) return

    setDreams((current) => [
      ...current,
      {
        id: `dream-${Date.now()}`,
        label: value,
        done: false,
        category: 'Dream',
      },
    ])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-accent-2">
          <Globe2 className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Couple Dream Board</h3>
        </div>
        <div className="rounded-full border border-accent-1/20 bg-soft-tint px-2 py-1 text-[10px] font-medium text-accent-1">
          {progress}% ready
        </div>
      </div>

      <div className="rounded-btn border border-accent-1/20 bg-card p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-text-1/60">
          <span>Future plans</span>
          <span>
            {dreams.filter((d) => d.done).length}/{dreams.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-card">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-1 via-accent-1 to-accent-2"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {dreams.map((dream) => (
          <motion.button
            key={dream.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleDream(dream.id)}
            className={`flex w-full items-center justify-between rounded-btn border px-3 py-2 text-left text-sm transition ${
              dream.done
                ? 'border-accent-1/20 bg-accent-2/20 text-text-1'
                : 'border-accent-1/20 bg-card/25 text-text-1/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className={`h-4 w-4 ${dream.done ? 'fill-current' : ''}`} />
              {dream.label}
            </span>
            <span className="rounded-full bg-card/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]">
              {dream.category}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a shared dream"
          className="w-full rounded-btn border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1 placeholder:text-text-1/40 outline-none"
        />
        <button
          onClick={addDream}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add dream"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-btn border border-accent-1/30 bg-gradient-to-r from-accent-1 to-accent-1 p-3">
        <div className="mb-2 flex items-center gap-2 text-accent-2">
          <MapPin className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Next date idea</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dateIdeas.map((idea) => (
            <button
              key={idea}
              onClick={() => setSelectedIdea(idea)}
              className={`rounded-full border px-2.5 py-1.5 text-xs transition ${
                selectedIdea === idea
                  ? 'border-accent-1/20 bg-accent-1/20 text-accent-1'
                  : 'border-accent-1/20 bg-card text-text-1/75'
              }`}
            >
              {idea}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-text-1/80">
          <Sparkles className="mr-1 inline h-4 w-4 text-accent-1" />
          {selectedIdea}
        </p>
      </div>
    </div>
  )
}
