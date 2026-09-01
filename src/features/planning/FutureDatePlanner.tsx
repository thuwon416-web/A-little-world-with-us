'use client'

import { useEffect, useState } from 'react'
import { CalendarHeart, Plus, Sparkles } from 'lucide-react'

type Plan = {
  id: string
  title: string
  date: string
  note: string
}

const starterPlans: Plan[] = [
  {
    id: 'f1',
    title: 'Weekend getaway',
    date: '2026-09-20',
    note: 'Sunrise drive and late breakfast',
  },
  { id: 'f2', title: 'Movie night', date: '2026-09-24', note: 'Something soft and cozy' },
]

export default function FutureDatePlanner() {
  const [plans, setPlans] = useState<Plan[]>(starterPlans)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('future-date-planner')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setPlans(parsed)
        }
      }
    } catch {
      // ignore gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('future-date-planner', JSON.stringify(plans))
  }, [plans])

  const addPlan = () => {
    const planTitle = title.trim()
    const planNote = note.trim()
    if (!planTitle || !date) return

    setPlans((current) => [
      ...current,
      {
        id: `plan-${Date.now()}`,
        title: planTitle,
        date,
        note: planNote || 'A little surprise, just for us.',
      },
    ])
    setTitle('')
    setDate(new Date().toISOString().slice(0, 10))
    setNote('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <CalendarHeart className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Future Date Planner</h3>
      </div>

      <div className="space-y-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--text-primary)]">{plan.title}</span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
                {plan.date}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-primary)]/75">{plan.note}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Plan title"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <button
            onClick={addPlan}
            className="glass-button px-3 py-2 text-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Add a little note for the date..."
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Future promise
        </div>
        <p>We do not need a perfect plan. We just need a reason to keep choosing each other.</p>
      </div>
    </div>
  )
}
