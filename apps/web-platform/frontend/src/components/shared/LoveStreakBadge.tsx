'use client'

import { useEffect, useState } from 'react'
import { Flame, Heart } from 'lucide-react'
import { getLoveStreak, checkInLoveStreak, type LoveStreakData } from '@/services/love-streak'

interface LoveStreakBadgeProps {
  coupleId?: string | null
  className?: string
  compact?: boolean
}

export default function LoveStreakBadge({
  coupleId,
  className = '',
  compact = false,
}: LoveStreakBadgeProps) {
  const [streakData, setStreakData] = useState<LoveStreakData>({
    current_streak: 0,
    last_check_in: null,
    checkedInToday: false,
  })
  const [loading, setLoading] = useState(false)
  const [justCheckedIn, setJustCheckedIn] = useState(false)

  useEffect(() => {
    if (!coupleId) return
    let active = true

    void getLoveStreak(coupleId).then((data) => {
      if (active) setStreakData(data)
    })

    return () => {
      active = false
    }
  }, [coupleId])

  const handleCheckIn = async () => {
    if (!coupleId || loading || streakData.checkedInToday) return
    setLoading(true)

    try {
      const updated = await checkInLoveStreak(coupleId)
      setStreakData(updated)
      setJustCheckedIn(true)
      setTimeout(() => setJustCheckedIn(false), 4000)
    } catch (error) {
      console.error('Failed to check in love streak:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!coupleId) return null

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border border-accent-1/25 bg-accent-1/10 px-3 py-1 text-xs font-medium text-text-1 backdrop-blur-sm ${className}`}
      >
        <Flame className="h-3.5 w-3.5 text-accent-1 animate-pulse" />
        <span>{streakData.current_streak} {streakData.current_streak === 1 ? 'day' : 'days'}</span>
        {streakData.checkedInToday ? (
          <span className="text-[10px] text-accent-1">❤️</span>
        ) : (
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading}
            className="ml-1 text-[11px] font-semibold text-accent-1 underline hover:opacity-80 active:scale-95"
          >
            {loading ? '...' : 'Check-in'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2.5 rounded-2xl border border-accent-1/20 bg-card/85 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all ${
        justCheckedIn ? 'ring-2 ring-accent-1 ring-offset-2' : ''
      } ${className}`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-accent-1 to-accent-2 text-white shadow-inner">
        <Flame className="h-5 w-5 fill-current" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-text-1">
            {streakData.current_streak} {streakData.current_streak === 1 ? 'Day' : 'Days'} Streak
          </span>
          {justCheckedIn && (
            <span className="animate-bounce text-xs font-semibold text-accent-1">
              +1 Day! 🎉
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-2">
          {streakData.checkedInToday
            ? 'Checked in together today ❤️'
            : 'Keep your couple love streak alive'}
        </p>
      </div>

      {!streakData.checkedInToday ? (
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-1 to-accent-2 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Heart className="h-3.5 w-3.5 fill-current" />
          <span>{loading ? 'Checking in…' : 'Check-in today'}</span>
        </button>
      ) : (
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-accent-1/30 bg-accent-1/10 px-2.5 py-1 text-[11px] font-medium text-accent-1">
          <Heart className="h-3 w-3 fill-current" />
          Done
        </span>
      )}
    </div>
  )
}
