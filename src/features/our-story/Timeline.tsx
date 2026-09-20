'use client'

import { BookHeart } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import MemoryCard from './MemoryCard'
import { EmptyState as SharedEmptyState } from '@/components/ui/empty-state'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'

const PAGE_SIZE = 50

function Timeline({ coupleId }: { coupleId: string }) {
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [year, setYear] = useState('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (reset = true) => {
    reset ? setLoading(true) : setLoadingMore(true)
    setError('')
    try {
      const next = await relationshipMemoriesService.getHighlights(coupleId, reset ? PAGE_SIZE : memories.length + PAGE_SIZE)
      setMemories(next)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the timeline.')
    } finally {
      reset ? setLoading(false) : setLoadingMore(false)
    }
  }, [coupleId, memories.length])

  // Highlights are refreshed when the active couple changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load() }, [coupleId])

  const years = useMemo(
    () => [...new Set(memories.map((memory) => new Date(memory.date_time).getFullYear()))].sort((a, b) => b - a),
    [memories]
  )
  const visible = year === 'all' ? memories : memories.filter((memory) => String(new Date(memory.date_time).getFullYear()) === year)
  const groups = useMemo(() => visible.reduce<Record<string, RelationshipMemory[]>>((result, memory) => {
    const date = new Date(memory.date_time)
    const key = `${date.getFullYear()} · ${date.toLocaleString('en-US', { month: 'long' })}`
    ;(result[key] ??= []).push(memory)
    return result
  }, {}), [visible])

  if (loading) return <LoadingCards />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!memories.length)
    return (
      <SharedEmptyState
        icon={BookHeart}
        title="No memories yet"
        description="Upload Telegram data to get started."
      />
    )

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 text-sm text-text-2">
        Filter by year
        <select value={year} onChange={(event) => setYear(event.target.value)} className="rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-text-1">
          <option value="all">All years</option>
          {years.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <div className="space-y-8">
        {Object.entries(groups).map(([label, entries]) => (
          <section key={label} className="relative border-l border-accent-1/30 pl-5">
            <div className="absolute -left-2 top-1 h-4 w-4 rounded-full bg-accent-1" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-text-1">{label}</h3>
              <span className="text-xs text-text-2">{entries.length} memories</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">{entries.map((memory) => <MemoryCard key={memory.id} memory={memory} />)}</div>
          </section>
        ))}
      </div>
      {memories.length >= PAGE_SIZE ? <button type="button" onClick={() => void load(false)} disabled={loadingMore} className="rounded-xl border border-accent-1/25 px-4 py-2 text-sm text-text-1">{loadingMore ? 'Loading…' : 'Load more highlights'}</button> : null}
    </div>
  )
}

export default memo(Timeline)

export function LoadingCards() {
  return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-36 animate-pulse rounded-panel bg-card" />)}</div>
}



export function EmptyState() {
  return (
    <SharedEmptyState
      icon={BookHeart}
      title="No memories yet"
      description="Upload Telegram data to get started."
    />
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-panel border border-rose-400/30 bg-rose-400/5 p-6 text-center"><p className="text-sm text-rose-300">{message}</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl border border-rose-300/30 px-4 py-2 text-sm text-text-1">Retry</button></div>
}
