'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Heart, Activity } from 'lucide-react'

interface CycleData {
  lastPeriodStart?: Date
  cycleLength?: number
  periodLength?: number
}

interface CycleDashboardProps {
  cycleData?: CycleData
}

interface Insight {
  id: string
  text: string
  textMy: string
  icon: React.ReactNode
}

export default function CycleDashboard({ cycleData }: CycleDashboardProps) {
  const [daysUntilPeriod, setDaysUntilPeriod] = useState(9)
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Low')
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0)

  const insights: Insight[] = [
    {
      id: '1',
      text: 'Stay hydrated during your cycle to reduce bloating and fatigue.',
      textMy: 'ရာသီလာလအတွင်း ဖောရောင်မှုနှင့် ပင်နိုင်းကို လျော့နည်းစေရန် ရေများသောက်ပါ။',
      icon: <Heart className="h-5 w-5" />,
    },
    {
      id: '2',
      text: 'Light exercise like yoga can help relieve period cramps.',
      textMy: 'ယောဂသည့်ကဲ့သို့ နုပ်ပြီးရွေ့လှုပ်ခန်းသည် ရာသီလာလကိုက်ခဲမှုကို လျော့နည်းစေပါသည်။',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      id: '3',
      text: 'Track your cycle regularly for better predictions.',
      textMy: 'ပိုကောင်းသောခန့်မှန်းချက်များအတွက် လစဉ်စက်ဝန်းကို ပုံမှန်စောင့်ကြည့်ပါ။',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ]

  useEffect(() => {
    // Calculate days until period (simplified logic)
    if (cycleData?.lastPeriodStart && cycleData?.cycleLength) {
      const lastPeriod = new Date(cycleData.lastPeriodStart)
      const nextPeriod = new Date(lastPeriod.getTime() + cycleData.cycleLength * 24 * 60 * 60 * 1000)
      const today = new Date()
      const diff = Math.ceil((nextPeriod.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      setDaysUntilPeriod(Math.max(0, diff))
    }

    // Calculate risk level based on cycle day
    const cycleDay = new Date().getDate()
    if (cycleDay >= 10 && cycleDay <= 16) {
      setRiskLevel('High')
    } else if (cycleDay >= 8 && cycleDay <= 9 || cycleDay >= 17 && cycleDay <= 18) {
      setRiskLevel('Medium')
    } else {
      setRiskLevel('Low')
    }
  }, [cycleData])

  // Auto-scroll insights
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsightIndex((prev) => (prev + 1) % insights.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [insights.length])

  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
      case 'Medium':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-500'
      case 'High':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-500'
    }
  }

  const getRiskLevelBg = () => {
    switch (riskLevel) {
      case 'Low':
        return 'from-emerald-500/20 to-emerald-600/20'
      case 'Medium':
        return 'from-amber-500/20 to-amber-600/20'
      case 'High':
        return 'from-rose-500/20 to-rose-600/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Period Countdown */}
      <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-[var(--accent-1)]" />
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Next Period</p>
        </div>
        <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
          Period in {daysUntilPeriod} days
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {daysUntilPeriod <= 3 ? 'Prepare for your period soon!' : 'You have time to prepare'}
        </p>
      </div>

      {/* Risk Level */}
      <div className={`rounded-2xl border-2 p-5 bg-gradient-to-r ${getRiskLevelBg()}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">Pregnancy Risk Level</p>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor()}`}>
            {riskLevel}
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {riskLevel === 'High' && 'High chances of getting pregnant'}
          {riskLevel === 'Medium' && 'Medium chances of getting pregnant'}
          {riskLevel === 'Low' && 'Low chances of getting pregnant'}
        </p>
        <p className="text-xs text-[var(--text-secondary)]/60 mt-2">
          * This is an estimate, not medical advice
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition"
        >
          <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-2xl">
            🩸
          </div>
          <span className="text-xs font-medium text-rose-500">Log Period</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition"
        >
          <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-2xl">
            ➕
          </div>
          <span className="text-xs font-medium text-purple-500">Symptoms</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 transition"
        >
          <div className="w-16 h-16 rounded-full bg-pink-500 flex items-center justify-center text-2xl">
            ❤️
          </div>
          <span className="text-xs font-medium text-pink-500">Sex</span>
        </button>
      </div>

      {/* Insights Carousel */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Daily Insights</p>
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentInsightIndex * 100}%)` }}
          >
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="w-full flex-shrink-0 rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)] flex-shrink-0">
                    {insight.icon}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{insight.text}</p>
                    <p className="text-xs text-[var(--text-secondary)]/80 mt-1">{insight.textMy}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Carousel Dots */}
        <div className="flex justify-center gap-2">
          {insights.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentInsightIndex(index)}
              className={`h-2 w-2 rounded-full transition ${
                index === currentInsightIndex ? 'bg-[var(--accent-1)]' : 'bg-[var(--accent-1)]/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
