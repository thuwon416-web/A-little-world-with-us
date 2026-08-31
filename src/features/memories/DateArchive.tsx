'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Star } from 'lucide-react'

type ArchiveEntry = {
  id: number
  title: string
  date: string
  rating: number
  note: string
}

const starterEntries: ArchiveEntry[] = [
  {
    id: 1,
    title: 'Sunset picnic',
    date: '2026-07-12',
    rating: 5,
    note: 'Golden light, warm snacks, and quiet laughter for the entire evening.',
  },
  {
    id: 2,
    title: 'City lights walk',
    date: '2026-08-02',
    rating: 4,
    note: 'A dreamy night with soft music and a million tiny moments to remember.',
  },
]

export default function DateArchive() {
  const [entries, setEntries] = useState<ArchiveEntry[]>(starterEntries)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-08-25')
  const [rating, setRating] = useState(5)
  const [note, setNote] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('our-forever-date-archive')
    if (stored) setEntries(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('our-forever-date-archive', JSON.stringify(entries))
  }, [entries])

  const addEntry = () => {
    if (!title.trim() || !note.trim()) return
    setEntries((prev) => [
      { id: Date.now(), title: title.trim(), date, rating, note: note.trim() },
      ...prev,
    ])
    setTitle('')
    setDate('2026-08-25')
    setRating(5)
    setNote('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <CalendarClock className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Date Archive</h3>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            whileHover={{ y: -2 }}
            className="rounded-2xl bg-[var(--card-bg)] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-[var(--text-primary)]">{entry.title}</div>
              <div className="flex items-center gap-1 text-[var(--accent-2)]">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`w-3.5 h-3.5 ${index < entry.rating ? 'fill-current' : 'opacity-40'}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-1 text-[11px] opacity-60">{entry.date}</div>
            <p className="mt-2 text-sm opacity-75">{entry.note}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Date name"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <input
          type="range"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="One-line memory"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <button onClick={addEntry} className="glass-button w-full text-sm">
          Add date
        </button>
      </div>
    </div>
  )
}
