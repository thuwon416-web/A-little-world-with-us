'use client'

import {
  Cake,
  Gift,
  Handshake,
  Heart,
  HeartCrack,
  HeartHandshake,
  Laugh,
  MapPin,
  MessageCircle,
  NotebookPen,
  Palette,
  Plane,
  Repeat,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { RelationshipMemory } from '@/shared-types'

const categoryIcons: Record<string, LucideIcon> = {
  first_events: Sparkles,
  conflicts: HeartCrack,
  promises: Handshake,
  special_dates: Cake,
  emotional_expressions: Heart,
  physical_affection: HeartHandshake,
  locations: MapPin,
  inside_jokes_nicknames: Laugh,
  favorites: Star,
  routines: Repeat,
  personal_details: NotebookPen,
  gifts: Gift,
  future_plans: Target,
  travel: Plane,
  milestones: Trophy,
  social_circle: Users,
  shared_activities: Palette,
  vulnerable_moments: Heart,
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value)
  )
}

function formatCategory(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function MemoryCard({ memory }: { memory: RelationshipMemory }) {
  return (
    <article className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {(() => {
            const Icon = categoryIcons[memory.category] ?? MessageCircle
            return <Icon size={24} aria-hidden="true" className="shrink-0 text-[var(--accent-1)]" />
          })()}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
              {formatCategory(memory.category)}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">{formatDate(memory.date_time)}</p>
          </div>
        </div>
        {memory.importance === 'critical' || memory.importance === 'high' ? (
          <span className="rounded-full bg-[var(--accent-1)]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-1)]">
            {memory.importance}
          </span>
        ) : null}
      </div>
      {memory.quote_burmese ? (
        <p className="mt-4 text-base leading-relaxed text-[var(--text-primary)]">{memory.quote_burmese}</p>
      ) : null}
      {memory.context ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{memory.context}</p>
      ) : null}
    </article>
  )
}
