'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDailyLogs, getCurrentMonthLogs } from '@/lib/care-data'

interface MoodDataPoint { mood: string; count: number }
interface SymptomDataPoint { symptom: string; count: number }
interface CycleLengthData { average: number; shortest: number; longest: number; cycles: number[] }

export default function InsightsTrends() {
  const [loading, setLoading] = useState(true)
  const [moodData, setMoodData] = useState<MoodDataPoint[]>([])
  const [symptomData, setSymptomData] = useState<SymptomDataPoint[]>([])
  const [cycleLengthData, setCycleLengthData] = useState<CycleLengthData>({ average: 28, shortest: 28, longest: 28, cycles: [] })

  useEffect(() => { loadInsightsData() }, [])

  const loadInsightsData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const allLogs = await getDailyLogs(user.id)
      const currentMonthLogs = await getCurrentMonthLogs(user.id)

      const moodCounts: Record<string, number> = {}
      currentMonthLogs.forEach(log => {
        if (log.mood) moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1
      })
      setMoodData(Object.entries(moodCounts).map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count))

      const symptomCounts: Record<string, number> = {}
      allLogs.forEach(log => {
        if (log.symptoms) {
          log.symptoms.forEach((symptom: string) => {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1
          })
        }
      })
      setSymptomData(Object.entries(symptomCounts).map(([symptom, count]) => ({ symptom, count })).sort((a, b) => b.count - a.count).slice(0, 10))

      const periodLogs = allLogs.filter(log =>
        log.symptoms?.includes('Period started') || log.other_tags?.includes('Period start')
      ).sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())

      const cycleLengths: number[] = []
      for (let i = 1; i < Math.min(periodLogs.length, 6); i++) {
        const daysBetween = Math.floor(
          (new Date(periodLogs[i - 1].log_date).getTime() - new Date(periodLogs[i].log_date).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysBetween > 0 && daysBetween < 60) cycleLengths.push(daysBetween)
      }

      setCycleLengthData({
        average: cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28,
        shortest: cycleLengths.length > 0 ? Math.min(...cycleLengths) : 28,
        longest: cycleLengths.length > 0 ? Math.max(...cycleLengths) : 28,
        cycles: cycleLengths,
      })
    } catch (error) {
      console.error('Error loading insights data:', error)
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
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-serif text-[var(--text-primary)]">Insights & Trends</h2>

      {/* Mood Trends */}
      <div className="glass-card p-4">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Mood This Month</h3>
        {moodData.length > 0 ? (
          <div className="space-y-2">
            {moodData.map((item) => (
              <div key={item.mood} className="flex items-center gap-3">
                <span className="w-24 text-sm text-[var(--text-primary)]">{item.mood}</span>
                <div className="flex-1 rounded-full bg-[var(--card-bg-strong)] h-4">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
                    style={{ width: `${(item.count / moodData.reduce((a, b) => a + b.count, 0)) * 100}%` }}
                  />
                </div>
                <span className="text-sm w-8 text-[var(--text-primary)]">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No mood data yet. Start logging your mood!</p>
        )}
      </div>

      {/* Symptom Patterns */}
      <div className="glass-card p-4">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Most Common Symptoms</h3>
        {symptomData.length > 0 ? (
          <div className="space-y-2">
            {symptomData.map((item, index) => (
              <div key={item.symptom} className="flex items-center gap-3">
                <span className="w-6 text-sm text-[var(--text-secondary)]">{index + 1}</span>
                <span className="flex-1 text-sm text-[var(--text-primary)]">{item.symptom}</span>
                <span className="rounded bg-[var(--accent-1)]/20 px-2 py-1 text-sm text-[var(--accent-1)]">
                  {item.count} times
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No symptom data yet. Start tracking!</p>
        )}
      </div>

      {/* Cycle Length */}
      <div className="glass-card p-4">
        <h3 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Cycle Length History</h3>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)]">Average</p>
            <p className="text-2xl font-bold text-[var(--accent-1)]">{cycleLengthData.average} days</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)]">Shortest</p>
            <p className="text-2xl font-bold text-[var(--accent-2)]">{cycleLengthData.shortest} days</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-[var(--text-secondary)]">Longest</p>
            <p className="text-2xl font-bold text-purple-500">{cycleLengthData.longest} days</p>
          </div>
        </div>
        {cycleLengthData.cycles.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto">
            {cycleLengthData.cycles.map((length, index) => (
              <div key={index} className="min-w-[60px] rounded-lg bg-gradient-to-b from-[var(--accent-1)] to-[var(--accent-2)] p-3 text-center">
                <p className="text-xs text-white/80">Cycle {index + 1}</p>
                <p className="text-lg font-bold text-white">{length}d</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-secondary)]">No cycle data yet. Log your period to see trends!</p>
        )}
      </div>
    </div>
  )
}
