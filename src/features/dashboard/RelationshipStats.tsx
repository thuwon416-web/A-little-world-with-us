'use client'

import { useEffect, useMemo, useState } from 'react'
import { calculateDaysTogether } from '@/lib/relationship-days'
import { supabase } from '@/lib/supabase'

export default function RelationshipStats() {
  const [counts, setCounts] = useState({ memories: 0, messages: 0, streak: 0 })

  useEffect(() => {
    let active = true

    const loadCounts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: link } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle()
      if (!link?.couple_id) return

      const [{ count: memoryCount }, { count: messageCount }, { data: messageDates }] = await Promise.all([
        supabase.from('memories').select('id', { count: 'exact', head: true }).eq('couple_id', link.couple_id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('couple_id', link.couple_id),
        supabase.from('messages').select('created_at').eq('couple_id', link.couple_id).order('created_at', { ascending: false }),
      ])

      const uniqueDays = [...new Set((messageDates ?? []).map((message) => message.created_at.slice(0, 10)))]
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
        setCounts({
          memories: memoryCount ?? 0,
          messages: messageCount ?? 0,
          streak: longestStreak,
        })
      }
    }

    void loadCounts()
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    return [
      { label: 'Days together', value: calculateDaysTogether().toLocaleString() },
      { label: 'Memories', value: counts.memories.toLocaleString() },
      { label: 'Messages', value: counts.messages.toLocaleString() },
      { label: 'Vault items', value: '27' },
      { label: 'Longest streak', value: `${counts.streak} days` },
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
