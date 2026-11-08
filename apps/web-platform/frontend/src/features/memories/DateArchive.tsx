'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
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
  const [isHydrated, setIsHydrated] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [transferMessage, setTransferMessage] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-08-25')
  const [rating, setRating] = useState(5)
  const [note, setNote] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('a-little-world-with-us-date-archive')
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored)
        if (!Array.isArray(parsed)) throw new Error('Archive is not a list')
        const validEntries = parsed.filter((entry): entry is ArchiveEntry => {
          if (!entry || typeof entry !== 'object') return false
          const candidate = entry as Partial<ArchiveEntry>
          return typeof candidate.id === 'number'
            && typeof candidate.title === 'string'
            && typeof candidate.date === 'string'
            && typeof candidate.rating === 'number'
            && typeof candidate.note === 'string'
        })
        setEntries(validEntries)
      } catch {
        setLoadError('Your saved date archive could not be read. New entries will be saved safely.')
      }
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem('a-little-world-with-us-date-archive', JSON.stringify(entries))
  }, [entries, isHydrated])

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

  const exportArchive = () => {
    const blob = new Blob([
      JSON.stringify({ format: 'a-little-world-date-archive', version: 1, exportedAt: new Date().toISOString(), entries }, null, 2),
    ], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'a-little-world-date-archive.json'
    link.click()
    URL.revokeObjectURL(url)
    setTransferMessage('Archive exported. Keep this file somewhere safe.')
  }

  const importArchive = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid archive')
      const candidate = parsed as { format?: unknown; entries?: unknown }
      if (candidate.format !== 'a-little-world-date-archive' || !Array.isArray(candidate.entries)) throw new Error('Invalid archive')
      const imported = candidate.entries.filter((entry): entry is ArchiveEntry => {
        if (!entry || typeof entry !== 'object') return false
        const value = entry as Partial<ArchiveEntry>
        return typeof value.id === 'number' && typeof value.title === 'string' && typeof value.date === 'string'
          && typeof value.rating === 'number' && typeof value.note === 'string'
      })
      setEntries((current) => [...imported, ...current.filter((entry) => !imported.some((item) => item.id === entry.id))])
      setTransferMessage(`${imported.length} archive entr${imported.length === 1 ? 'y' : 'ies'} restored.`)
    } catch {
      setTransferMessage('That file is not a valid date archive export.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-accent-2">
        <CalendarClock className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Date Archive</h3>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            whileHover={{ y: -2 }}
            className="rounded-btn bg-card p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-text-1">{entry.title}</div>
              <div className="flex items-center gap-1 text-accent-2">
                {[...new Array(5)].map((_, index) => (
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
        {loadError && <p role="status" className="text-sm text-amber-500">{loadError}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={exportArchive} className="glass-button flex-1 text-sm">Export archive</button>
          <button type="button" onClick={() => importRef.current?.click()} className="glass-button flex-1 text-sm">Restore archive</button>
          <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={importArchive} />
        </div>
        {transferMessage && <p role="status" className="text-sm text-text-1">{transferMessage}</p>}
        <label className="sr-only" htmlFor="date-archive-title">Date name</label>
        <input
          id="date-archive-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Date name"
          className="w-full rounded-btn border border-accent-1/20 bg-card p-3 text-sm outline-none"
        />
        <label className="sr-only" htmlFor="date-archive-date">Date</label>
        <input
          id="date-archive-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-btn border border-accent-1/20 bg-card p-3 text-sm outline-none"
        />
        <label className="text-xs text-text-1" htmlFor="date-archive-rating">Rating: {rating} out of 5</label>
        <input
          id="date-archive-rating"
          type="range"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full"
        />
        <label className="sr-only" htmlFor="date-archive-note">Memory note</label>
        <textarea
          id="date-archive-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="One-line memory"
          className="w-full rounded-btn border border-accent-1/20 bg-card p-3 text-sm outline-none"
        />
        <button onClick={addEntry} className="glass-button w-full text-sm">
          Add date
        </button>
      </div>
    </div>
  )
}
