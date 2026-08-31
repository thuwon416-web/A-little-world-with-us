'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Flag, Sparkles } from 'lucide-react'

type Plan = {
  id: number
  title: string
  type: string
  dueDate: string
  status: 'In progress' | 'Completed'
  items: { id: number; label: string; done: boolean }[]
}

const initialPlans: Plan[] = [
  {
    id: 1,
    title: 'Weekend getaway',
    type: 'Trip',
    dueDate: 'May 18',
    status: 'In progress',
    items: [
      { id: 1, label: 'Book flights', done: true },
      { id: 2, label: 'Pick hotel', done: false },
      { id: 3, label: 'Plan one surprise', done: false },
    ],
  },
  {
    id: 2,
    title: 'Mini anniversary plan',
    type: 'Date',
    dueDate: 'Jun 02',
    status: 'In progress',
    items: [
      { id: 1, label: 'Reserve dinner', done: true },
      { id: 2, label: 'Buy flowers', done: true },
      { id: 3, label: 'Write a note', done: false },
    ],
  },
]

const bucketList = [
  'Watch the sunrise together in a new city',
  'Take a road trip with no itinerary',
  'Create a mini home gallery wall',
]

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)

  const progress = useMemo(() => {
    const totalTasks = plans.reduce((sum, plan) => sum + plan.items.length, 0)
    const completedTasks = plans.reduce(
      (sum, plan) => sum + plan.items.filter((item) => item.done).length,
      0,
    )
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
  }, [plans])

  const toggleItem = (planId: number, itemId: number) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id !== planId
          ? plan
          : {
              ...plan,
              items: plan.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            },
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Shared plans</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Our next chapters</h1>
        </div>
        <button type="button" className="rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]">
          New plan
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {plans.map((plan) => {
            const doneCount = plan.items.filter((item) => item.done).length
            const planProgress = plan.items.length ? Math.round((doneCount / plan.items.length) * 100) : 0

            return (
              <div key={plan.id} className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{plan.type}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{plan.title}</h2>
                  </div>
                  <div className="rounded-full bg-[var(--card-bg-strong)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                    {plan.status}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CalendarDays className="h-4 w-4 text-[var(--accent-2)]" />
                  Due {plan.dueDate}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                    <span>Progress</span>
                    <span>{planProgress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--bg-2)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
                      style={{ width: `${planProgress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {plan.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(plan.id, item.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[var(--card-bg-strong)] px-3 py-2 text-left text-[var(--text-primary)]"
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          item.done
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                            : 'border-[var(--text-secondary)] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span className={item.done ? 'line-through text-[var(--text-secondary)]' : ''}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3 text-[var(--accent-1)]">
              <Flag className="h-5 w-5" />
              <span className="text-sm font-medium">Overall progress</span>
            </div>
            <p className="mt-4 text-4xl font-semibold text-[var(--text-primary)]">{progress}%</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Shared dreams are moving forward.</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3 text-[var(--accent-2)]">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Bucket list</span>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-primary)]">
              {bucketList.map((item) => (
                <li key={item} className="rounded-2xl bg-[var(--card-bg-strong)] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
