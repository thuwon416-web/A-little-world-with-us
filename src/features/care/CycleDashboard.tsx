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
    <div className="space-y-6">
      {/* Period Countdown */}
      <div className="text-center p-6 bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl">
        <h2 className="text-4xl font-bold text-white">
          Period in {daysUntilPeriod} days
        </h2>
        <p className="text-white/80 mt-2">
          {cycleData?.last_period_start
            ? `Last period: ${new Date(cycleData.last_period_start).toLocaleDateString()}`
            : 'No period data yet'}
        </p>
      </div>

      {/* Risk Level */}
      <div className={`p-4 rounded-lg ${
        riskLevel === 'Low' ? 'bg-green-600/20 border border-green-600' :
        riskLevel === 'Medium' ? 'bg-yellow-600/20 border border-yellow-600' :
        'bg-red-600/20 border border-red-600'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {riskLevel === 'Low' ? '🟢' : riskLevel === 'Medium' ? '🟡' : '🔴'}
          </span>
          <div>
            <p className="font-semibold">
              {riskLevel === 'Low' ? 'Low' : riskLevel === 'Medium' ? 'Medium' : 'High'} chances of getting pregnant
            </p>
            <p className="text-xs mt-1 opacity-80">
              ⚠️ <strong>Important:</strong> This is an estimate based on your logged cycle data.
              <br />
              For pregnancy planning or contraception, please consult a healthcare provider.
              <br />
              Cycle predictions may vary due to stress, illness, or lifestyle changes.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => onOpenDailyLog?.()}
          className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-700 flex flex-col items-center justify-center text-white transition"
        >
          <span className="text-2xl">🩸</span>
          <span className="text-xs mt-1">Log Period</span>
        </button>
        <button
          onClick={() => onOpenDailyLog?.()}
          className="w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-700 flex flex-col items-center justify-center text-white transition"
        >
          <span className="text-2xl">➕</span>
          <span className="text-xs mt-1">Symptoms</span>
        </button>
        <button
          onClick={() => onOpenDailyLog?.()}
          className="w-20 h-20 rounded-full bg-pink-600 hover:bg-pink-700 flex flex-col items-center justify-center text-white transition"
        >
          <span className="text-2xl">❤️</span>
          <span className="text-xs mt-1">Sex</span>
        </button>
      </div>

      {/* Insights Carousel */}
      <div className="flex overflow-x-auto gap-4 pb-2">
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg min-w-[200px] text-white">
          <p className="font-semibold">Cycle Length</p>
          <p className="text-2xl font-bold mt-1">
            {cycleData?.average_cycle_length || 28} days
          </p>
        </div>
        <div className="p-4 bg-gradient-to-r from-rose-600 to-orange-600 rounded-lg min-w-[200px] text-white">
          <p className="font-semibold">Next Period</p>
          <p className="text-2xl font-bold mt-1">
            {cycleData?.next_period_start
              ? new Date(cycleData.next_period_start).toLocaleDateString()
              : 'Unknown'}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg min-w-[200px] text-white">
          <p className="font-semibold">Fertile Window</p>
          <p className="text-sm font-bold mt-1">
            {cycleData?.fertile_window_start && cycleData?.fertile_window_end
              ? `${new Date(cycleData.fertile_window_start).toLocaleDateString()} - ${new Date(cycleData.fertile_window_end).toLocaleDateString()}`
              : 'Calculating...'}
          </p>
        </div>
      </div>
    </div>
  )
}
