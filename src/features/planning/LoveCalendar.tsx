'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Sparkles } from 'lucide-react'

type Entry = {
  id: string
  date: string
  label: string
  mood: 'sweet' | 'adventure' | 'quiet' | 'special'
  type: 'anniversary' | 'plan' | 'reminder'
}

const starterEntries: Entry[] = [
  {
    id: 'anniv',
    date: '2026-09-12',
    label: 'Our anniversary',
    mood: 'special',
    type: 'anniversary',
  },
  { id: 'movie', date: '2026-09-14', label: 'Movie night', mood: 'quiet', type: 'plan' },
  { id: 'hike', date: '2026-09-18', label: 'Hike + coffee', mood: 'adventure', type: 'plan' },
]

const moodColors: Record<Entry['mood'], string> = {
  sweet: 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]',
  adventure: 'bg-[var(--bg-2)] text-[var(--accent-1)]',
  quiet: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
  special: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
}

export default function LoveCalendar() {
  const [entries, setEntries] = useState<Entry[]>(starterEntries)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [label, setLabel] = useState('')
  const [mood, setMood] = useState<Entry['mood']>('sweet')
  const [type, setType] = useState<Entry['type']>('plan')

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem('love-calendar') || localStorage.getItem('a-little-world-with-us-calendar')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setEntries(
            parsed.map((entry) => ({
              id: String(entry.id),
              date: entry.date,
              label: entry.label ?? entry.title,
              mood: entry.mood ?? 'sweet',
              type: entry.type ?? 'plan',
            }))
          )
        }
      }
    } catch {
      // ignore local storage issues gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('love-calendar', JSON.stringify(entries))
  }, [entries])

  const upcoming = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
    [entries]
  )

  const addEntry = () => {
    const value = label.trim()
    if (!value || !selectedDate) return

    setEntries((current) => [
      ...current,
      {
        id: `entry-${Date.now()}`,
        date: selectedDate,
        label: value,
        mood,
        type,
      },
    ])
    setLabel('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <CalendarDays className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Calendar</h3>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Upcoming little moments</span>
          <span>{upcoming.length}</span>
        </div>
        <div className="space-y-2">
          {upcoming.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-2xl bg-[var(--card-bg)] px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{entry.label}</div>
                <div className="text-[11px] opacity-70">{entry.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.15em] ${moodColors[entry.mood]}`}
                >
                  {entry.mood}
                </span>
                <span className="rounded-full bg-[var(--card-bg)]/35 px-2 py-1 text-[9px] uppercase tracking-[0.15em]">
                  {entry.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <select
            value={mood}
            onChange={(event) => setMood(event.target.value as Entry['mood'])}
            className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-2 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="sweet">Sweet</option>
            <option value="adventure">Adventure</option>
            <option value="quiet">Quiet</option>
            <option value="special">Special</option>
          </select>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as Entry['type'])}
            className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-2 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="anniversary">Anniversary</option>
            <option value="plan">Plan</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Add a date idea"
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
          />
          <button onClick={addEntry} className="glass-button px-3 py-2 text-sm">
            Add
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Tiny reminder
        </div>
        <p>
          {selectedDate
            ? `Your next tiny ritual can be planned for ${selectedDate}.`
            : 'Pick a date and make it beautiful.'}
        </p>
      </div>
    </div>
  )
}
