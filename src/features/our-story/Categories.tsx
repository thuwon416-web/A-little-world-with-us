'use client'

import { BookHeart, Cake, HeartCrack, HeartHandshake, Handshake, MessageCircle, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import MemoryCard from './MemoryCard'
import { EmptyState as SharedEmptyState } from '@/components/ui/empty-state'
import { ErrorState, LoadingCards } from './Timeline'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'

const icons: Record<string, LucideIcon> = { promises: Handshake, physical_affection: HeartHandshake, conflicts: HeartCrack, favorites: Star, special_dates: Cake, first_events: Sparkles }

function Categories({ coupleId, onOpenCategory }: { coupleId: string; onOpenCategory?: (category: string) => void }) {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    relationshipMemoriesService.getStats(coupleId).then(setStats).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load categories.')).finally(() => setLoading(false))
  }, [coupleId])

  const toggle = useCallback(async (category: string) => {
    if (expanded === category) { setExpanded(null); return }
    setExpanded(category)
    try { setMemories((await relationshipMemoriesService.getByCategory(coupleId, category)).slice(0, 5)) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load category memories.') }
  }, [coupleId, expanded])

  const entries = useMemo(() => Object.entries(stats).sort(([, a], [, b]) => b - a), [stats])

  if (loading) return <LoadingCards />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!Object.keys(stats).length)
    return (
      <SharedEmptyState
        icon={BookHeart}
        title="No memories yet"
        description="Upload Telegram data to get started."
      />
    )
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{entries.map(([category, count]) => { const Icon = icons[category] ?? MessageCircle; return <div key={category} className="rounded-3xl border border-[var(--accent-1)]/15 bg-[var(--card-bg)] p-5 shadow-lg"><button type="button" onClick={() => void toggle(category)} className="flex w-full items-center gap-3 text-left"><Icon size={24} aria-hidden="true" className="shrink-0 text-[var(--accent-1)]" /><span className="flex-1 text-sm font-medium capitalize text-[var(--text-primary)]">{category.replace(/_/g, ' ')}</span><span className="text-sm text-[var(--text-secondary)]">{count}</span></button>{expanded === category ? <div className="mt-4 space-y-3">{memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />)}{onOpenCategory ? <button type="button" onClick={() => onOpenCategory(category)} className="text-sm text-[var(--accent-1)]">View all in this category</button> : null}</div> : null}</div> })}</div>
}

export default memo(Categories)
