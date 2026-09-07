'use client'

import { useState, useEffect } from 'react'
import { Heart, Clock, Sparkles } from 'lucide-react'

interface TodayInsightsProps { selectedDate?: Date | null }

export default function TodayInsights({ selectedDate }: TodayInsightsProps) {
  const [cycleDay, setCycleDay] = useState(14)
  const [isFertile, setIsFertile] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      const dayOfMonth = selectedDate.getDate()
      const newCycleDay = dayOfMonth > 28 ? dayOfMonth % 28 : dayOfMonth
      setCycleDay(newCycleDay)
      setIsFertile(dayOfMonth >= 10 && dayOfMonth <= 16)
    }
  }, [selectedDate])

  const cyclePhase = cycleDay <= 5 ? 'Period' : cycleDay >= 10 && cycleDay <= 16 ? 'Fertile' : 'Normal'
  const getPhaseColor = () => cyclePhase === 'Period' ? 'text-[var(--accent-1)] bg-[var(--accent-1)]/10' : cyclePhase === 'Fertile' ? 'text-emerald-500 bg-emerald-500/10' : 'text-[var(--accent-2)] bg-[var(--accent-2)]/10'

  return (
    <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]"><Heart className="h-5 w-5" /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Today's Insights</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{selectedDate ? selectedDate.toLocaleDateString() : 'Today'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--text-secondary)]">Cycle Day</p>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPhaseColor()}`}>{cyclePhase}</div>
        </div>
        <p className="text-3xl font-bold text-[var(--text-primary)]">Day {cycleDay}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">of 28-day cycle</p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-2)]/20 bg-[var(--card-bg-strong)] p-4">
        <div className="flex items-center gap-3 mb-2"><Clock className="h-4 w-4 text-[var(--accent-2)]" /><p className="text-xs text-[var(--text-secondary)]">Next Period</p></div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">11 days</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">until expected period</p>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4">
        <div className="flex items-center gap-3 mb-2"><Sparkles className="h-4 w-4 text-[var(--accent-1)]" /><p className="text-xs text-[var(--text-secondary)]">Fertile Window</p></div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Days 10 - 16</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{isFertile ? 'You are in fertile window' : 'Coming up soon'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">28</p>
          <p className="text-xs text-[var(--text-secondary)]">Avg Cycle</p>
        </div>
        <div className="rounded-xl border border-[var(--accent-2)]/20 bg-[var(--card-bg-strong)] p-3 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">5</p>
          <p className="text-xs text-[var(--text-secondary)]">Period Days</p>
        </div>
      </div>
    </div>
  )
}
