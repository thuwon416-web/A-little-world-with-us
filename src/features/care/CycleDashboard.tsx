'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDailyLogs, calculateCycleData, type CycleData } from '@/lib/care-data'

interface CycleDashboardProps {
  onOpenDailyLog?: () => void
}

export default function CycleDashboard({ onOpenDailyLog }: CycleDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [cycleData, setCycleData] = useState<CycleData | null>(null)
  const [daysUntilPeriod, setDaysUntilPeriod] = useState<number>(9)
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low')

  useEffect(() => {
    loadCycleData()
  }, [])

  const loadCycleData = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const logs = await getDailyLogs(user.id)

      const calculated = calculateCycleData(logs)
      setCycleData(calculated)

      if (calculated.next_period_start) {
        const days = Math.floor(
          (new Date(calculated.next_period_start).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
        )
        setDaysUntilPeriod(Math.max(0, days))
      }

      const today = new Date().toISOString().split('T')[0]
      const isFertile =
        calculated.fertile_window_start &&
        calculated.fertile_window_end &&
        today >= calculated.fertile_window_start &&
        today <= calculated.fertile_window_end

      if (isFertile) setRiskLevel('High')
      else if (calculated.ovulation_date && today === calculated.ovulation_date) setRiskLevel('High')
      else setRiskLevel('Low')

    } catch (error) {
      console.error('Error loading cycle data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--accent-2)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-[var(--text-primary)]">
      {/* Hero Section */}
      <section className="glass-card relative overflow-hidden px-5 py-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,215,0,0.14),_transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(255,107,157,0.12),_transparent_45%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Today&apos;s cycle</p>
          <button type="button" onClick={() => onOpenDailyLog?.()} className="glass-button mt-4 w-full rounded-2xl px-4 py-3 font-semibold transition hover:brightness-110">Open today&apos;s log</button>
          <h2 className="gold-text mt-3 text-4xl font-serif sm:text-5xl">Period in {daysUntilPeriod} days</h2>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            {riskLevel} estimated chance of pregnancy · predictions are not medical advice
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          ['🩸', 'Log period'],
          ['＋', 'Symptoms'],
          ['♡', 'Intimacy'],
        ].map(([icon, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => onOpenDailyLog?.()}
            className="group flex flex-col items-center gap-2 rounded-3xl py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent-1)]/50 bg-[var(--card-bg)] text-2xl text-[var(--accent-1)] shadow-[0_0_15px_rgba(255,107,157,0.2)] transition group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,107,157,0.4)]">
              {icon}
            </span>
            {label}
          </button>
        ))}
      </section>

      {/* Cycle History */}
      <section className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--accent-1)]/20 px-5 py-4">
          <h3 className="text-lg font-serif">Cycle history</h3>
          <span className="text-sm font-medium text-[var(--accent-1)]">Shared data</span>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Current cycle</span>
              <span>Day {Math.max(1, (cycleData?.average_cycle_length || 28) - daysUntilPeriod)}</span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 28 }, (_, index) => (
                <span
                  key={index}
                  className={`h-3 min-w-0 flex-1 rounded-full ${
                    index < 5
                      ? 'bg-[var(--accent-1)]'
                      : index < 15
                        ? 'bg-emerald-400/70'
                        : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--accent-1)]/20 pt-4 text-sm">
            <div>
              <p className="text-[var(--text-secondary)]">Average cycle</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {cycleData?.average_cycle_length || 28} days
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Next period</p>
              <p className="mt-1 text-sm font-semibold text-[var(--accent-2)]">
                {cycleData?.next_period_start
                  ? new Date(cycleData.next_period_start).toLocaleDateString()
                  : 'Log a period to predict'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Check-in */}
      <section className="glass-card p-5">
        <h3 className="text-lg font-serif">Daily check-in</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Log mood, symptoms, intimacy, notes, and anything you would like to remember.
        </p>
        <button
          type="button"
          onClick={() => onOpenDailyLog?.()}
          className="glass-button mt-4 w-full rounded-2xl px-4 py-3 font-semibold transition hover:brightness-110"
        >
          Today&apos;s cycle
        </button>
      </section>
    </div>
  )
}
