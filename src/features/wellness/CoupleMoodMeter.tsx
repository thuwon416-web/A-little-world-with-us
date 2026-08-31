'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'

const moodOptions = [
  { id: 'blissful', label: 'Blissful', color: 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]' },
  { id: 'happy', label: 'Happy', color: 'bg-[var(--bg-2)] text-[var(--accent-1)]' },
  { id: 'calm', label: 'Calm', color: 'bg-[var(--bg-2)] text-[var(--text-secondary)]' },
  { id: 'deep', label: 'Deep', color: 'bg-[var(--bg-2)] text-[var(--text-secondary)]' },
  { id: 'tired', label: 'Tired', color: 'bg-[var(--bg-2)] text-[var(--text-secondary)]' },
] as const

type MoodId = (typeof moodOptions)[number]['id']

export default function CoupleMoodMeter() {
  const [selectedMood, setSelectedMood] = useState<MoodId>('blissful')
  const [intensity, setIntensity] = useState(72)
  const [note, setNote] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('couple-mood-meter')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.mood) setSelectedMood(parsed.mood)
        if (typeof parsed?.intensity === 'number') setIntensity(parsed.intensity)
        if (typeof parsed?.note === 'string') setNote(parsed.note)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'couple-mood-meter',
      JSON.stringify({ mood: selectedMood, intensity, note })
    )
  }, [selectedMood, intensity, note])

  const currentMood = useMemo(
    () => moodOptions.find((mood) => mood.id === selectedMood) ?? moodOptions[0],
    [selectedMood]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Heart className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Couple Mood Meter</h3>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Today’s vibe</span>
          <span>{intensity}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--card-bg-strong)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--accent-2)]"
            initial={{ width: 0 }}
            animate={{ width: `${intensity}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {moodOptions.map((mood) => (
          <button
            key={mood.id}
            type="button"
            onClick={() => setSelectedMood(mood.id)}
            className={`rounded-2xl border px-2.5 py-2 text-sm transition ${
              selectedMood === mood.id
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            {mood.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          Connection intensity
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={intensity}
          onChange={(event) => setIntensity(Number(event.target.value))}
          className="w-full accent-pink-500"
        />
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="What made today feel this way?"
        className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
      />

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Current feeling
        </div>
        <p>
          {currentMood.label} energy is floating through the day — and that is enough to make it
          feel special.
        </p>
      </div>
    </div>
  )
}
