'use client'

import { useState, useMemo } from 'react'
import { TrendingUp, BarChart3, Activity, Heart, Sparkles, Calendar } from 'lucide-react'

interface CycleData {
  logs?: Array<{
    date: Date
    mood: string
    symptoms: string[]
  }>
  periods?: Array<{
    startDate: Date
    endDate: Date
  }>
}

interface InsightsTrendsProps {
  cycleData?: CycleData
}

interface MoodData {
  date: string
  mood: string
  count: number
}

interface SymptomData {
  symptom: string
  count: number
}

interface CycleLengthData {
  average: number
  shortest: number
  longest: number
  cycleLengths: number[]
}

export default function InsightsTrends({ cycleData }: InsightsTrendsProps) {
  const [selectedTab, setSelectedTab] = useState<'mood' | 'symptoms' | 'cycle'>('mood')

  // Mock data for demo - in production this would come from actual cycleData
  const moodData: MoodData[] = useMemo(() => [
    { date: 'Jan 1', mood: 'Happy', count: 8 },
    { date: 'Jan 2', mood: 'Calm', count: 12 },
    { date: 'Jan 3', mood: 'Energetic', count: 5 },
    { date: 'Jan 4', mood: 'Sad', count: 3 },
    { date: 'Jan 5', mood: 'Irritated', count: 2 },
    { date: 'Jan 6', mood: 'Happy', count: 10 },
    { date: 'Jan 7', mood: 'Calm', count: 9 },
  ], [])

  const symptomData: SymptomData[] = useMemo(() => [
    { symptom: 'Cramps', count: 15 },
    { symptom: 'Bloating', count: 12 },
    { symptom: 'Headache', count: 8 },
    { symptom: 'Fatigue', count: 18 },
    { symptom: 'Mood Changes', count: 14 },
    { symptom: 'Acne', count: 5 },
  ], [])

  const cycleLengthData: CycleLengthData = useMemo(() => ({
    average: 28,
    shortest: 26,
    longest: 31,
    cycleLengths: [28, 27, 29, 28, 26, 30, 31, 28],
  }), [])

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Happy':
        return 'bg-emerald-500'
      case 'Calm':
        return 'bg-blue-500'
      case 'Energetic':
        return 'bg-amber-500'
      case 'Sad':
        return 'bg-purple-500'
      case 'Irritated':
        return 'bg-rose-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'Happy':
        return '😊'
      case 'Calm':
        return '😐'
      case 'Energetic':
        return '⚡'
      case 'Sad':
        return '🥺'
      case 'Irritated':
        return '😡'
      default:
        return '🙂'
    }
  }

  const maxCount = Math.max(...symptomData.map((s) => s.count))

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedTab('mood')}
          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition ${
            selectedTab === 'mood'
              ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
              : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] text-[var(--text-secondary)] hover:border-[var(--accent-1)]/40'
          }`}
        >
          <Heart className="h-4 w-4 mx-auto mb-1" />
          Mood Trends
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('symptoms')}
          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition ${
            selectedTab === 'symptoms'
              ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
              : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] text-[var(--text-secondary)] hover:border-[var(--accent-1)]/40'
          }`}
        >
          <Activity className="h-4 w-4 mx-auto mb-1" />
          Symptoms
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('cycle')}
          className={`flex-1 p-3 rounded-xl border-2 text-sm font-medium transition ${
            selectedTab === 'cycle'
              ? 'border-[var(--accent-1)] bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
              : 'border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] text-[var(--text-secondary)] hover:border-[var(--accent-1)]/40'
          }`}
        >
          <Calendar className="h-4 w-4 mx-auto mb-1" />
          Cycle Length
        </button>
      </div>

      {/* Mood Trends */}
      {selectedTab === 'mood' && (
        <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Mood Trends</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">This Month</p>
            </div>
          </div>

          {/* Mood Chart */}
          <div className="space-y-3">
            {moodData.map((data) => (
              <div key={data.date} className="flex items-center gap-3">
                <span className="w-16 text-xs text-[var(--text-secondary)]">{data.date}</span>
                <div className="flex-1 h-8 rounded-lg bg-[var(--card-bg-strong)] overflow-hidden">
                  <div
                    className={`h-full ${getMoodColor(data.mood)} transition-all duration-500`}
                    style={{ width: `${(data.count / 15) * 100}%` }}
                  />
                </div>
                <span className="text-2xl">{getMoodEmoji(data.mood)}</span>
              </div>
            ))}
          </div>

          {/* Mood Summary */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--accent-1)]/20">
            <div className="text-center p-3 rounded-xl bg-[var(--card-bg-strong)]">
              <p className="text-2xl font-bold text-emerald-500">8</p>
              <p className="text-xs text-[var(--text-secondary)]">Happy Days</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--card-bg-strong)]">
              <p className="text-2xl font-bold text-blue-500">12</p>
              <p className="text-xs text-[var(--text-secondary)]">Calm Days</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-[var(--card-bg-strong)]">
              <p className="text-2xl font-bold text-rose-500">5</p>
              <p className="text-xs text-[var(--text-secondary)]">Other</p>
            </div>
          </div>
        </div>
      )}

      {/* Symptom Patterns */}
      {selectedTab === 'symptoms' && (
        <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Most Common Symptoms</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">This Month</p>
            </div>
          </div>

          {/* Symptom Bar Chart */}
          <div className="space-y-3">
            {symptomData.map((data) => (
              <div key={data.symptom} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-primary)]">{data.symptom}</span>
                  <span className="text-[var(--text-secondary)]">{data.count} days</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--card-bg-strong)] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${(data.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Insight */}
          <div className="p-4 rounded-xl border border-[var(--accent-2)]/20 bg-[var(--accent-2)]/5">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent-2)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Insight</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Fatigue is your most common symptom. Consider getting more rest during your period.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Length */}
      {selectedTab === 'cycle' && (
        <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Cycle Length</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">Stability Analysis</p>
            </div>
          </div>

          {/* Cycle Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10">
              <p className="text-3xl font-bold text-emerald-500">{cycleLengthData.average}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Average Days</p>
            </div>
            <div className="text-center p-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/10">
              <p className="text-3xl font-bold text-amber-500">{cycleLengthData.shortest}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Shortest</p>
            </div>
            <div className="text-center p-4 rounded-xl border-2 border-rose-500/30 bg-rose-500/10">
              <p className="text-3xl font-bold text-rose-500">{cycleLengthData.longest}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Longest</p>
            </div>
          </div>

          {/* Cycle History Chart */}
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)]">Cycle History (Last 8 cycles)</p>
            <div className="flex items-end gap-2 h-32">
              {cycleLengthData.cycleLengths.map((length, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-500 transition-all duration-300 hover:opacity-80"
                    style={{ height: `${(length / 35) * 100}%` }}
                  />
                  <span className="text-[10px] text-[var(--text-secondary)]">{length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stability Rating */}
          <div className="p-4 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Cycle Stability</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Your cycle is{' '}
                  {cycleLengthData.longest - cycleLengthData.shortest <= 3 ? 'very regular' : 'somewhat irregular'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="text-2xl font-bold text-emerald-500">
                  {cycleLengthData.longest - cycleLengthData.shortest <= 3 ? 'High' : 'Medium'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
