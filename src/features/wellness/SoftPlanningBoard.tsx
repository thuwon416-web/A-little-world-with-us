'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Heart, Plus, Sparkles, SunMedium } from 'lucide-react'

type PlanItem = {
  id: string
  title: string
  detail: string
  done: boolean
}

const starterPlans: PlanItem[] = [
  {
    id: 'plan-1',
    title: 'Slow Sunday ritual',
    detail: 'Make one morning completely free of tasks and noise.',
    done: true,
  },
  {
    id: 'plan-2',
    title: 'Cozy home evening',
    detail: 'Set aside one night for blankets, tea, and no rushing.',
    done: false,
  },
  {
    id: 'plan-3',
    title: 'Tiny outing',
    detail: 'Choose one place that feels gentle and easy to wander through.',
    done: true,
  },
]

const gentleGoals = [
  'Keep the pace gentle',
  'Make room for rest',
  'Protect small moments',
  'Choose comfort over perfection',
]

export default function SoftPlanningBoard() {
  const [plans, setPlans] = useState<PlanItem[]>(starterPlans)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('soft-planning-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setPlans(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('soft-planning-board', JSON.stringify(plans))
  }, [plans])

  const doneCount = useMemo(() => plans.filter((plan) => plan.done).length, [plans])
  const progress = plans.length ? Math.round((doneCount / plans.length) * 100) : 0

  const togglePlan = (id: string) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? { ...plan, done: !plan.done } : plan))
    )
  }

  const addPlan = () => {
    const valueTitle = title.trim()
    const valueDetail = detail.trim()
    if (!valueTitle || !valueDetail) return

    setPlans((current) => [
      ...current,
      { id: `plan-${Date.now()}`, title: valueTitle, detail: valueDetail, done: false },
    ])
    setTitle('')
    setDetail('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <CalendarClock className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Soft Planning Board</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {doneCount}/{plans.length}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Comfort goals</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--card-bg-strong)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--accent-2)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {plans.map((plan) => (
          <motion.button
            key={plan.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => togglePlan(plan.id)}
            className={`w-full rounded-2xl border p-3 text-left transition ${
              plan.done
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 text-[var(--text-primary)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{plan.title}</span>
              <span className="text-[9px] uppercase tracking-[0.18em]">
                {plan.done ? 'done' : 'later'}
              </span>
            </div>
            <p className={`mt-1 text-sm ${plan.done ? 'line-through opacity-75' : 'opacity-90'}`}>
              {plan.detail}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Plan a gentle ritual"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          rows={2}
          placeholder="What would make this moment feel safe, cozy, and real?"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button onClick={addPlan} className="glass-button w-full px-3 py-2 text-sm">
          Save plan
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] p-3">
        <div className="mb-2 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <SunMedium className="h-4 w-4" />
          Gentle focus
        </div>
        <div className="flex flex-wrap gap-2">
          {gentleGoals.map((goal) => (
            <span
              key={goal}
              className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--card-bg-strong)] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--accent-1)]"
            >
              {goal}
            </span>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--text-primary)]/80">
          Future plans feel lighter when they are built around softness instead of pressure.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Heart className="h-4 w-4" />
          Soft reminder
        </div>
        <p>It is okay for your plans to be small, unhurried, and beautifully real.</p>
      </div>
    </div>
  )
}
