'use client'

import { useEffect, useMemo, useState } from 'react'
import { calculateDaysTogether } from '@/lib/relationship-days'
import { supabase } from '@/lib/supabase'

type DashboardCounts = {
  memories: number | null
  messages: number | null
  vaultItems: number | null
  longestStreak: number | null
  dateNights: number | null
  inboxNotes: number | null
  careLogs: number | null
  loveStreak: number | null
  wellnessLogs: number | null
  financeProgress: number | null
  watchHistory: number | null
}

const initialCounts: DashboardCounts = {
  memories: null,
  messages: null,
  vaultItems: null,
  longestStreak: null,
  dateNights: null,
  inboxNotes: null,
  careLogs: null,
  loveStreak: null,
  wellnessLogs: null,
  financeProgress: null,
  watchHistory: null,
}

function countValue(count: number | null, error: unknown) {
  return error ? null : (count ?? 0)
}

export default function RelationshipStats() {
  const [counts, setCounts] = useState<DashboardCounts>(initialCounts)

  useEffect(() => {
    let active = true

    const loadCounts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: link } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle()
      if (!link?.couple_id) return

      const [
        memoriesResult,
        messagesResult,
        vaultItemsResult,
        messageDatesResult,
        dateNightsResult,
        inboxNotesResult,
        careLogsResult,
        loveStreakResult,
        wellnessLogsResult,
        financeGoalsResult,
        watchHistoryResult,
      ] = await Promise.all([
        supabase
          .from('memories')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id),
        supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id),
        supabase
          .from('vault_items')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id),
        supabase
          .from('messages')
          .select('created_at')
          .eq('couple_id', link.couple_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id)
          .eq('type', 'date'),
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id),
        supabase
          .from('care_daily_logs')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id),
        supabase
          .from('love_streaks')
          .select('current_streak')
          .eq('couple_id', link.couple_id)
          .maybeSingle(),
        supabase
          .from('wellness_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('financial_goals')
          .select('target_amount,current_amount')
          .eq('couple_id', link.couple_id),
        supabase
          .from('watch_history')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id),
      ])

      const uniqueDays = [
        ...new Set(
          (messageDatesResult.data ?? []).map((message) => message.created_at.slice(0, 10))
        ),
      ]
      let longestStreak = 0
      let currentStreak = 0
      for (let index = 0; index < uniqueDays.length; index += 1) {
        const current = new Date(`${uniqueDays[index]}T12:00:00`)
        const previous = index === 0 ? null : new Date(`${uniqueDays[index - 1]}T12:00:00`)
        if (!previous || Math.round((previous.getTime() - current.getTime()) / 86_400_000) === 1) {
          currentStreak += 1
        } else {
          currentStreak = 1
        }
        longestStreak = Math.max(longestStreak, currentStreak)
      }

      if (active) {
        const financeGoals = financeGoalsResult.data ?? []
        const financeTarget = financeGoals.reduce(
          (sum, goal) => sum + Number(goal.target_amount),
          0
        )
        const financeCurrent = financeGoals.reduce(
          (sum, goal) => sum + Number(goal.current_amount),
          0
        )
        setCounts({
          memories: countValue(memoriesResult.count, memoriesResult.error),
          messages: countValue(messagesResult.count, messagesResult.error),
          vaultItems: countValue(vaultItemsResult.count, vaultItemsResult.error),
          longestStreak: messageDatesResult.error ? null : longestStreak,
          dateNights: countValue(dateNightsResult.count, dateNightsResult.error),
          inboxNotes: countValue(inboxNotesResult.count, inboxNotesResult.error),
          careLogs: countValue(careLogsResult.count, careLogsResult.error),
          loveStreak: loveStreakResult.error ? null : (loveStreakResult.data?.current_streak ?? 0),
          wellnessLogs: countValue(wellnessLogsResult.count, wellnessLogsResult.error),
          financeProgress:
            financeGoalsResult.error || financeTarget <= 0
              ? financeGoalsResult.error
                ? null
                : 0
              : Math.round((financeCurrent / financeTarget) * 100),
          watchHistory: countValue(watchHistoryResult.count, watchHistoryResult.error),
        })
      }
    }

    void loadCounts()
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const display = (value: number | null, suffix = '') =>
      value === null ? '—' : `${value.toLocaleString()}${suffix}`

    return [
      { label: 'Days together', value: calculateDaysTogether().toLocaleString() },
      { label: 'Memories', value: display(counts.memories) },
      { label: 'Messages', value: display(counts.messages) },
      { label: 'Vault items', value: display(counts.vaultItems) },
      { label: 'Longest streak', value: display(counts.longestStreak, ' days') },
      { label: 'Date nights', value: display(counts.dateNights) },
      { label: 'Inbox notes', value: display(counts.inboxNotes) },
      { label: 'Care logs', value: display(counts.careLogs) },
      { label: 'Love streak', value: display(counts.loveStreak, ' days') },
      { label: 'Wellness logs', value: display(counts.wellnessLogs) },
      { label: 'Finance progress', value: display(counts.financeProgress, '%') },
      { label: 'Watched together', value: display(counts.watchHistory) },
    ]
  }, [counts])

  return (
    <section className="dashboard-grid dashboard-grid--stats">
      {stats.map((stat) => (
        <div key={stat.label} className="dashboard-stat-card">
          <p className="dashboard-stat-card__label">{stat.label}</p>
          <p className="dashboard-stat-card__value">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}
