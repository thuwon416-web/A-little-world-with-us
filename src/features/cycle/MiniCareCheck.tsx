'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Heart, Sparkles } from 'lucide-react'

const options = [
  { id: 'rested', label: 'Rested' },
  { id: 'connected', label: 'Connected' },
  { id: 'nourished', label: 'Nourished' },
  { id: 'peaceful', label: 'Peaceful' },
] as const

type CareId = (typeof options)[number]['id']

export default function MiniCareCheck() {
  const [selected, setSelected] = useState<CareId>('rested')
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mini-care-check')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed?.selected === 'string') {
          const valid = options.some(item => item.id === parsed.selected)
          if (valid) setSelected(parsed.selected as CareId)
        }
        if (typeof parsed?.note === 'string') setNote(parsed.note)
      }
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    localStorage.setItem('mini-care-check', JSON.stringify({ selected, note }))
  }, [selected, note, isLoading])

  return (
    <div className="dashboard-card-interactive dashboard-card-glow dashboard-fade-in space-y-4 rounded-[1.5rem] p-4">
      <div className="flex items-center gap-2 text-accent-2">
        <Heart className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Mini Care Check</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="dashboard-shimmer h-11 rounded-btn" />
            <div className="dashboard-shimmer h-11 rounded-btn" />
            <div className="dashboard-shimmer h-11 rounded-btn" />
            <div className="dashboard-shimmer h-11 rounded-btn" />
          </div>
          <div className="dashboard-shimmer h-20 rounded-btn" />
        </div>
      ) : hasError ? (
        <div className="rounded-btn border border-accent-1/20 bg-card/50 p-4">
          <p className="text-sm text-text-1">We couldn&apos;t load your care summary</p>
          <button type="button" onClick={() => setHasError(false)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent-1/25 bg-accent-1/10 px-3 py-2 text-sm font-medium text-text-1">
            Retry <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelected(option.id)}
                className={`rounded-btn border px-3 py-2 text-sm transition ${
                  selected === option.id
                    ? 'border-accent-1/20 bg-accent-1/20 text-accent-1'
                    : 'border-accent-1/20 bg-card/25 text-text-1/80'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="What does your body and heart need today?"
            className="glass-input w-full rounded-btn px-3 py-2 text-sm text-text-1 placeholder:text-text-1/40"
          />

          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-btn border border-accent-1/20 bg-gradient-to-r from-accent-2 to-accent-1 p-3 text-sm text-text-1/80"
          >
            <div className="mb-1 flex items-center gap-2 font-medium text-accent-2">
              <Sparkles className="h-4 w-4" />
              Care note
            </div>
            <p>
              {selected === 'rested' && 'Rest is not a luxury — it is part of staying soft and steady.'}
              {selected === 'connected' && 'Connection helps the heart feel less heavy.'}
              {selected === 'nourished' && 'A nourishing moment can reset the whole day.'}
              {selected === 'peaceful' && 'Peace is a beautiful kind of strength.'}
            </p>
          </motion.div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-accent-1/25 bg-accent-1/10 px-3 py-2 text-sm font-medium text-text-1"
          >
            Check in <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}
