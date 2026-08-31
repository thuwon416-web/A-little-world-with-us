'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CloudSun, Sparkles } from 'lucide-react'

const weatherOptions = [
  { id: 'sunshine', label: 'Sunshine', note: 'Everything feels brilliant and easy.' },
  { id: 'cloudy', label: 'Cloudy', note: 'A slower day, but still warm and safe.' },
  { id: 'rainy', label: 'Rainy', note: 'A little softness and comfort is all we need.' },
  { id: 'magic', label: 'Magic', note: 'The day has a kind of sparkle that only love can make.' },
] as const

type WeatherId = (typeof weatherOptions)[number]['id']

export default function LoveWeather() {
  const [selected, setSelected] = useState<WeatherId>('sunshine')
  const [note, setNote] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('love-weather')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed?.mood === 'string') {
          const valid = weatherOptions.some((option) => option.id === parsed.mood)
          if (valid) setSelected(parsed.mood as WeatherId)
        }
        if (typeof parsed?.note === 'string') setNote(parsed.note)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('love-weather', JSON.stringify({ mood: selected, note }))
  }, [selected, note])

  const current = useMemo(
    () => weatherOptions.find((option) => option.id === selected) ?? weatherOptions[0],
    [selected]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <CloudSun className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Weather</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {weatherOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className={`rounded-2xl border px-2.5 py-2 text-sm transition ${
              selected === option.id
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
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
        placeholder="What is the atmosphere of today?"
        className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
      />

      <motion.div
        key={selected}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80"
      >
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Today’s weather
        </div>
        <p>{current.note}</p>
      </motion.div>
    </div>
  )
}
