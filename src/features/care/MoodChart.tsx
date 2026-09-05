'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MoodChart() {
  const [moods, setMoods] = useState<any[]>([])
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

  const moodEmoji: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    anxious: '😰',
    calm: '😌',
    irritable: '😠',
    tired: '😴',
    energetic: '⚡',
  }

  if (loading) {
    return (
      <div className="p-4 bg-white/10 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white/10 rounded-lg">
      <h3 className="font-medium mb-4">Mood This Week</h3>
      {moods.length > 0 ? (
        <div className="flex justify-between gap-2">
          {moods.map((log, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl">{moodEmoji[log.mood] || '😐'}</span>
              <span className="text-xs text-gray-400 mt-1">
                {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No mood data yet</p>
      )}
    </div>
  )
}
