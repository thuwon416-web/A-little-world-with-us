'use client'

import { useEffect, useState } from 'react'
import { Heart, PenLine } from 'lucide-react'

const starterEntries = [
  'I am grateful for the way you make even ordinary mornings feel warm.',
  'I love how safe and seen I feel when I am with you.',
  'Thank you for being gentle with my heart and patient with my growth.',
]

export default function GratitudeWall() {
  const [entries, setEntries] = useState(starterEntries)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('a-little-world-with-us-gratitude')
    if (stored) setEntries(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('a-little-world-with-us-gratitude', JSON.stringify(entries))
  }, [entries])

  const addEntry = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    setEntries((prev) => [trimmed, ...prev])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Heart className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Gratitude Wall</h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={`${entry}-${index}`}
            className="rounded-2xl bg-[var(--card-bg)] px-3 py-2 text-sm leading-relaxed text-[var(--text-primary)]/80"
          >
            {entry}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--accent-1)]">
          <PenLine className="w-3.5 h-3.5" />
          Write a note
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
          placeholder="What do you want to thank them for today?"
        />
        <button onClick={addEntry} className="glass-button w-full text-sm">
          Add to wall
        </button>
      </div>
    </div>
  )
}
