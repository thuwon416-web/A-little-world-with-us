'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { calculateDaysTogether } from '@/lib/relationship-days'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { t } = useLanguage()
  const [counts, setCounts] = useState<DashboardCounts>(initialCounts)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unlinked' | 'error'>('loading')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let active = true

    const loadCounts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (active) setStatus('unlinked')
        return
      }

      const { data: link } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle()
      if (!link?.couple_id) {
        if (active) setStatus('unlinked')
        return
      }

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
          .from('relationship_memories')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', link.couple_id)
          .not('message_type', 'in', '(sos,location)'),
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
        setStatus('ready')
      }
    }

    void loadCounts().catch(() => {
      if (active) setStatus('error')
    })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const display = (value: number | null, suffix = '') =>
      value === null ? '—' : `${value.toLocaleString()}${suffix}`

    return [
      { label: t('dashboard.relationship.daysTogether'), value: calculateDaysTogether().toLocaleString() },
      { label: t('dashboard.relationship.memories'), value: display(counts.memories) },
      { label: t('dashboard.relationship.messages'), value: display(counts.messages) },
      { label: t('dashboard.relationship.vaultItems'), value: display(counts.vaultItems) },
      { label: t('dashboard.relationship.longestStreak'), value: display(counts.longestStreak, ` ${t('dashboard.daysSuffix')}`) },
      { label: t('dashboard.relationship.dateNights'), value: display(counts.dateNights) },
      { label: t('dashboard.relationship.inboxNotes'), value: display(counts.inboxNotes) },
      { label: t('dashboard.relationship.careLogs'), value: display(counts.careLogs) },
      { label: t('dashboard.relationship.loveStreak'), value: display(counts.loveStreak, ` ${t('dashboard.daysSuffix')}`) },
      { label: t('dashboard.relationship.wellnessLogs'), value: display(counts.wellnessLogs) },
      { label: t('dashboard.relationship.financeProgress'), value: display(counts.financeProgress, '%') },
      { label: t('dashboard.relationship.watchedTogether'), value: display(counts.watchHistory) },
    ]
  }, [counts, t])

  const visibleStats = showAll ? stats : stats.slice(0, 6)

  if (status === 'loading') {
    return (
      <section aria-label={t('dashboard.relationship.ariaLabel')} aria-busy="true">
        <div className="dashboard-grid dashboard-grid--stats">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-panel bg-card" />
          ))}
        </div>
      </section>
    )
  }

  if (status === 'unlinked') {
    return (
      <section aria-label={t('dashboard.relationship.ariaLabel')} className="rounded-panel border border-accent-1/15 bg-card p-5">
        <p className="font-medium text-text-1">{t('dashboard.relationship.linkPartner')}</p>
        <Link href="/couple-linking" className="mt-2 inline-flex text-sm font-semibold text-accent-1 hover:underline">
          {t('dashboard.relationship.setUpLink')}
        </Link>
      </section>
    )
  }

  return (
    <section aria-label={t('dashboard.relationship.ariaLabel')}>
      {status === 'error' ? (
        <p className="mb-3 text-sm text-text-2" role="status">{t('dashboard.relationship.partialError')}</p>
      ) : null}
      <div className="dashboard-grid dashboard-grid--stats">
        {visibleStats.map((stat) => (
          <div key={stat.label} className="dashboard-stat-card">
            <p className="dashboard-stat-card__label">{stat.label}</p>
            <p className="dashboard-stat-card__value">{stat.value}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-accent-1 underline-offset-4 hover:underline"
        aria-expanded={showAll}
        onClick={() => setShowAll((current) => !current)}
      >
        {showAll ? t('dashboard.relationship.showFewer') : t('dashboard.relationship.viewAll')}
      </button>
    </section>
  )
}
