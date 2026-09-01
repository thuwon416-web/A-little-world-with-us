'use client'

import { useState, useEffect } from 'react'
import { Calendar, Heart, Moon, TrendingUp } from 'lucide-react'
import { calculateCycle, formatPhase, type CycleData, type CyclePrediction } from '@/lib/cycleCalculator'
import { insertRow, readRows } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export default function CycleTrackerWidget() {
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [cycleLength, setCycleLength] = useState('28')

  useEffect(() => {
    loadCycleData()
  }, [])

  const loadCycleData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const logs = await readRows('cycle_logs', '*', {
      column: 'start_date',
      ascending: false,
    }) as any[]

    if (logs.length > 0) {
      const log = logs[0] as any
      setPrediction(calculateCycle({
        startDate: new Date(log.start_date),
        cycleLength: log.cycle_length || 28,
      }))
    }
  }

  const handleSave = async () => {
    if (!startDate || !cycleLength) return

    const data: CycleData = {
      startDate: new Date(startDate),
      cycleLength: parseInt(cycleLength),
    }

    const pred = calculateCycle(data)

    await insertRow('cycle_logs', {
      start_date: data.startDate.toISOString().split('T')[0],
      cycle_length: data.cycleLength,
      phase: pred.phase,
      fertile_window_start: pred.fertileWindowStart?.toISOString().split('T')[0],
      fertile_window_end: pred.fertileWindowEnd?.toISOString().split('T')[0],
      intimacy_score: pred.intimacyScore,
    })

    setPrediction(pred)
    setIsEditing(false)
  }

  if (!prediction) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Moon className="h-5 w-5 text-[var(--accent-1)]" />
          Cycle Tracker
        </h3>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Last period start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Cycle length (days)</label>
              <input
                type="number"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full rounded-xl bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full rounded-xl border border-dashed border-[var(--accent-1)]/30 bg-[var(--bg-2)] px-3 py-4 text-sm text-[var(--text-secondary)]"
          >
            + Track your cycle
          </button>
        )}
      </div>
    )
  }

  const phaseInfo = formatPhase(prediction.phase)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Moon className="h-5 w-5 text-[var(--accent-1)]" />
          Cycle Tracker
        </h3>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          Edit
        </button>
      </div>

      <div className="space-y-4">
        {/* Current Phase */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Current Phase</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{phaseInfo.en}</p>
            <p className="text-xs text-[var(--text-secondary)]">{phaseInfo.mm}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            prediction.phase === 'ovulation'
              ? 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
              : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
          }`}>
            Day {prediction.dayInCycle}
          </div>
        </div>

        {/* Fertile Window */}
        {prediction.fertileWindowStart && prediction.fertileWindowEnd && (
          <div className="rounded-xl bg-[var(--bg-2)] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-[var(--accent-1)]" />
              <p className="text-xs font-medium text-[var(--text-primary)]">Fertile Window</p>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {prediction.fertileWindowStart.toLocaleDateString()} - {prediction.fertileWindowEnd.toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Intimacy Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--accent-1)]" />
            <p className="text-xs text-[var(--text-secondary)]">Energy Level</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < prediction.intimacyScore ? 'bg-[var(--accent-1)]' : 'bg-[var(--bg-2)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Next Period */}
        {prediction.nextPeriodStart && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Calendar className="h-4 w-4" />
            <span>Next period: {prediction.nextPeriodStart.toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
