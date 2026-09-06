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

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch daily logs
      const logs = await getDailyLogs(user.id)

      // Calculate cycle data
      const calculated = calculateCycleData(logs)
      setCycleData(calculated)

      // Calculate days until period
      if (calculated.next_period_start) {
        const days = Math.floor(
          (new Date(calculated.next_period_start).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
        )
        setDaysUntilPeriod(Math.max(0, days))
      }

      // Calculate risk level based on fertile window
      const today = new Date().toISOString().split('T')[0]
      const isFertile =
        calculated.fertile_window_start &&
        calculated.fertile_window_end &&
        today >= calculated.fertile_window_start &&
        today <= calculated.fertile_window_end

      if (isFertile) {
        setRiskLevel('High')
      } else if (calculated.ovulation_date && today === calculated.ovulation_date) {
        setRiskLevel('High')
      } else {
        setRiskLevel('Low')
      }

    } catch (error) {
      console.error('Error loading cycle data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-[28px] bg-[#fff8f6] p-4 text-[#241d22] shadow-sm sm:p-6">
      <section className="rounded-[24px] bg-[radial-gradient(circle_at_top_right,_#fde1db,_transparent_52%),linear-gradient(145deg,_#fffdfc,_#fff1ee)] px-5 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b767b]">Today&apos;s cycle</p>
        <p className="mt-3 text-lg font-semibold">Period in</p>
        <h2 className="mt-1 text-5xl font-bold tracking-tight">{daysUntilPeriod} days</h2>
        <p className="mt-4 text-sm text-[#62545a]">
          {riskLevel} estimated chance of pregnancy · predictions are not medical advice
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        {[
          ['🩸', 'Log period'],
          ['＋', 'Symptoms'],
          ['♡', 'Intimacy'],
        ].map(([icon, label]) => (
          <button key={label} type="button" onClick={() => onOpenDailyLog?.()} className="group flex flex-col items-center gap-2 rounded-3xl py-2 text-sm font-medium hover:bg-[#fff0f2]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm ring-1 ring-[#f2dddd] transition group-hover:scale-105">{icon}</span>
            {label}
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#f0e5e2] bg-white">
        <div className="flex items-center justify-between border-b border-[#f4ebea] px-5 py-4">
          <h3 className="text-lg font-bold">Cycle history</h3>
          <span className="text-sm font-medium text-[#ef5d85]">Your data</span>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <div className="flex justify-between text-sm"><span className="font-semibold">Current cycle</span><span>Day {Math.max(1, (cycleData?.average_cycle_length || 28) - daysUntilPeriod)}</span></div>
            <div className="mt-3 flex gap-1">{Array.from({ length: 28 }, (_, index) => <span key={index} className={`h-2 flex-1 rounded-full ${index < 5 ? 'bg-[#ff5d89]' : index < 15 ? 'bg-[#a9ddd8]' : 'bg-[#eee9e8]'}`} />)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[#f4ebea] pt-4 text-sm">
            <div><p className="text-[#83757a]">Average cycle</p><p className="mt-1 text-xl font-bold">{cycleData?.average_cycle_length || 28} days</p></div>
            <div><p className="text-[#83757a]">Next period</p><p className="mt-1 text-sm font-semibold">{cycleData?.next_period_start ? new Date(cycleData.next_period_start).toLocaleDateString() : 'Log a period to predict'}</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#f0e5e2] bg-white p-5">
        <h3 className="text-lg font-bold">Daily check-in</h3>
        <p className="mt-1 text-sm text-[#75676d]">Log mood, symptoms, notes, and anything you would like to remember.</p>
        <button type="button" onClick={() => onOpenDailyLog?.()} className="mt-4 w-full rounded-2xl bg-[#ff5d89] px-4 py-3 font-semibold text-white transition hover:bg-[#ed4e7a]">Open today&apos;s log</button>
      </section>
    </div>
  )
}
