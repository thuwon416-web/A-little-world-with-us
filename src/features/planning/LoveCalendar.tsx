'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Sparkles } from 'lucide-react'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

type Entry = {
  id: string
  date: string
  label: string
  mood: 'sweet' | 'adventure' | 'quiet' | 'special'
  type: 'anniversary' | 'plan' | 'reminder'
}

type CanonicalEventType = 'date' | 'trip' | 'goal' | 'life' | 'other'

const toCanonicalType: Record<Entry['type'], CanonicalEventType> = {
  anniversary: 'date',
  plan: 'goal',
  reminder: 'other',
}

const fromCanonicalType: Record<CanonicalEventType, Entry['type']> = {
  date: 'anniversary',
  trip: 'plan',
  goal: 'plan',
  life: 'plan',
  other: 'reminder',
}

const moodColors: Record<Entry['mood'], string> = {
  sweet: 'bg-accent-1/20 text-accent-1',
  adventure: 'bg-soft-tint text-accent-1',
  quiet: 'bg-soft-tint text-text-2',
  special: 'bg-soft-tint text-text-2',
}

export default function LoveCalendar() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [label, setLabel] = useState('')
  const [mood, setMood] = useState<Entry['mood']>('sweet')
  const [type, setType] = useState<Entry['type']>('plan')

  const loadEntries = async (activeCoupleId: string) => {
    const { data } = await supabase
      .from('events')
      .select('id,event_date,title,type')
      .eq('couple_id', activeCoupleId)
      .order('event_date', { ascending: true })
    setEntries(
      (data ?? []).map((entry) => ({
        id: entry.id,
        date: String(entry.event_date).slice(0, 10),
        label: entry.title ?? 'Untitled plan',
        mood: entry.type === 'date' ? 'special' : entry.type === 'goal' ? 'adventure' : 'sweet',
        type: fromCanonicalType[entry.type as CanonicalEventType] ?? 'reminder',
      }))
    )
  }

  useEffect(() => {
    void Promise.all([getCurrentUserId(), getCoupleStatus()]).then(([id, status]) => {
      const activeCoupleId = status.status === 'accepted' ? (status.couple?.id ?? null) : null
      setUserId(id)
      setCoupleId(activeCoupleId)
      if (activeCoupleId) void loadEntries(activeCoupleId)
    })
  }, [])

  const upcoming = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
    [entries]
  )

  const addEntry = async () => {
    const value = label.trim()
    if (!value || !selectedDate || !coupleId || !userId) return
    const { error } = await supabase.from('events').insert({
      user_id: userId,
      couple_id: coupleId,
      event_date: selectedDate,
      event_time: null,
      description: null,
      title: value,
      type: toCanonicalType[type],
      repeat: null,
    })
    if (!error) {
      setLabel('')
      await loadEntries(coupleId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-accent-2">
        <CalendarDays className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Calendar</h3>
      </div>

      <div className="rounded-btn border border-accent-1/20 bg-card p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-text-1/60">
          <span>Upcoming little moments</span>
          <span>{upcoming.length}</span>
        </div>
        <div className="space-y-2">
          {upcoming.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-btn bg-card px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium text-text-1">{entry.label}</div>
                <div className="text-[11px] opacity-70">{entry.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.15em] ${moodColors[entry.mood]}`}
                >
                  {entry.mood}
                </span>
                <span className="rounded-full bg-card/35 px-2 py-1 text-[9px] uppercase tracking-[0.15em]">
                  {entry.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-btn border border-accent-1/20 bg-card/15 p-3">
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1"
          />
          <select
            value={mood}
            onChange={(event) => setMood(event.target.value as Entry['mood'])}
            className="rounded-xl border border-accent-1/20 bg-card px-2 py-2 text-sm text-text-1"
          >
            <option value="sweet">Sweet</option>
            <option value="adventure">Adventure</option>
            <option value="quiet">Quiet</option>
            <option value="special">Special</option>
          </select>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as Entry['type'])}
            className="rounded-xl border border-accent-1/20 bg-card px-2 py-2 text-sm text-text-1"
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
            className="w-full rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1 placeholder:text-text-1/40"
          />
          <button
            onClick={() => void addEntry()}
            disabled={!coupleId}
            className="glass-button px-3 py-2 text-sm disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {!coupleId && (
        <p className="text-sm text-warning">
          Accept a couple link to save plans shared by both accounts.
        </p>
      )}

      <div className="rounded-btn border border-accent-1/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-text-1/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-accent-2">
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
