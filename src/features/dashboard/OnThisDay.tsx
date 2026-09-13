'use client'

import { BookHeart, Cake, Heart, HeartCrack, Handshake, MessageCircle, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'

const icons: Record<string, LucideIcon> = {
  first_events: Sparkles,
  conflicts: HeartCrack,
  promises: Handshake,
  special_dates: Cake,
  emotional_expressions: Heart,
  physical_affection: Heart,
  favorites: Star,
}

function yearsAgo(date: string) {
  return Math.max(1, new Date().getFullYear() - new Date(date).getFullYear())
}

function OnThisDay({ coupleId }: { coupleId: string }) {
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    relationshipMemoriesService
      .getOnThisDay(coupleId, new Date())
      .then((data) => setMemories(data.slice(0, 3)))
      .catch(() => setMemories([]))
      .finally(() => setLoading(false))
  }, [coupleId])

  const visibleMemories = useMemo(() => memories.slice(0, 3), [memories])

  return (
    <section className="glass-card dashboard-panel rounded-2xl p-6">
      <p className="dashboard-kicker">On This Day</p>
      {loading ? (
        <div className="mt-3 h-20 animate-pulse rounded-2xl bg-[var(--card-bg-strong)]" />
      ) : memories.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={BookHeart}
            title="No memories yet"
            description="No memories from this day yet. Add more shared moments to keep the timeline alive."
          />
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {visibleMemories.map((memory) => (
            <article key={memory.id} className="border-l-2 border-[var(--accent-1)]/40 pl-3">
              <p className="text-xs text-[var(--text-secondary)]">
                {yearsAgo(memory.date_time)} years ago today
              </p>
              {(() => {
                const Icon = icons[memory.category] ?? MessageCircle
                return <Icon size={20} aria-hidden="true" className="mt-1 text-[var(--accent-1)]" />
              })()}
              {memory.quote_burmese ? (
                <p className="mt-1 text-sm text-[var(--text-primary)]">{memory.quote_burmese}</p>
              ) : null}
              {memory.context ? (
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {memory.context}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default memo(OnThisDay)
