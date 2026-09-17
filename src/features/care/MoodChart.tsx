'use client'

import {
  Angry,
  Frown,
  Meh,
  Moon,
  Smile,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

type MoodLog = { log_date: string; mood: string | null }

export default function MoodChart() {
  const [moods, setMoods] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMoods()
  }, [])

  const loadMoods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('care_daily_logs')
        .select('log_date, mood')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })
        .limit(7)

      if (data) setMoods(data)
    } catch (error) {
      console.error('Error loading moods:', error)
    } finally {
      setLoading(false)
    }
  }

  const moodIcons: Record<string, typeof Smile> = {
    happy: Smile,
    sad: Frown,
    anxious: Sparkles,
    calm: Smile,
    irritable: Angry,
    tired: Moon,
    energetic: Zap,
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-[var(--card-bg)] p-4">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--accent-1)]"></div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-[var(--card-bg)] p-4">
      <h3 className="font-medium mb-4">Mood This Week</h3>
      {moods.length > 0 ? (
        <div className="flex justify-between gap-2">
          {moods.map((log, i) => {
            const Icon = moodIcons[log.mood || ''] || Meh
            return (
              <div key={i} className="flex flex-col items-center">
                <Icon className="h-7 w-7 text-[var(--accent-1)]" />
                <span className="mt-1 text-xs text-[var(--text-secondary)]">
                  {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">No mood data yet</p>
      )}
    </div>
  )
}
