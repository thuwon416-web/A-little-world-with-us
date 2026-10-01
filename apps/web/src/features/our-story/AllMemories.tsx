'use client'

import { BookHeart } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import MemoryCard from './MemoryCard'
import { EmptyState as SharedEmptyState } from '@/components/ui/empty-state'
import { ErrorState, LoadingCards } from './Timeline'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { MemoryImportance, RelationshipMemory } from '@/shared-types'

const PAGE_SIZE = 15
const PREVIEW_SIZE = 5
const ROTATION_MS = 30_000

function AllMemories({ coupleId, initialCategory = 'all' }: { coupleId: string; initialCategory?: string }) {
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory)
  const [importance, setImportance] = useState<MemoryImportance | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState('')

  const load = useCallback(async (offset = 0) => {
    offset ? setLoadingMore(true) : setLoading(true)
    setError('')
    try {
      const next = search.trim()
        ? await relationshipMemoriesService.search(coupleId, search.trim())
        : await relationshipMemoriesService.getByCouple(coupleId, { limit: PAGE_SIZE, offset })
      setMemories((current) => offset && !search.trim() ? [...current, ...next] : next)
      setHasMore(!search.trim() && next.length === PAGE_SIZE)
      if (!offset) setRotation(0)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load memories.')
    } finally {
      offset ? setLoadingMore(false) : setLoading(false)
    }
  }, [coupleId, search])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    setShowAll(false)
    setRotation(0)
  }, [search, category, importance, from, to])

  const filtered = useMemo(() => memories.filter((memory) => {
    const date = new Date(memory.date_time)
    return (category === 'all' || memory.category === category) &&
      (importance === 'all' || memory.importance === importance) &&
      (!from || date >= new Date(`${from}T00:00:00`)) &&
      (!to || date <= new Date(`${to}T23:59:59`))
  }), [category, from, importance, memories, to])

  const preview = useMemo(() => {
    if (showAll || filtered.length <= PREVIEW_SIZE) return filtered
    const start = (rotation * PREVIEW_SIZE) % filtered.length
    return Array.from({ length: Math.min(PREVIEW_SIZE, filtered.length) }, (_, index) => filtered[(start + index) % filtered.length])
  }, [filtered, rotation, showAll])

  useEffect(() => {
    if (showAll || filtered.length <= PREVIEW_SIZE) return
    const timer = window.setInterval(() => setRotation((current) => current + 1), ROTATION_MS)
    return () => window.clearInterval(timer)
  }, [filtered.length, showAll])

  const categories = useMemo(() => [...new Set(memories.map((memory) => memory.category))].sort((a, b) => a.localeCompare(b)), [memories])

  if (loading) return <LoadingCards />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!memories.length) {
    return (
      <SharedEmptyState
        icon={BookHeart}
        title="No memories yet"
        description="Upload Telegram data to get started."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Burmese or English…" className="rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-sm text-text-1 outline-none" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1"><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}</select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select value={importance} onChange={(event) => setImportance(event.target.value as MemoryImportance | 'all')} className="rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1"><option value="all">All importance</option>{['critical', 'high', 'medium', 'low'].map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-xl border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-1">Showing a rotating preview of {Math.min(PREVIEW_SIZE, filtered.length)} memories</p>
        <button type="button" onClick={() => setShowAll((current) => !current)} className="rounded-full border border-accent-1/25 px-4 py-2 text-sm font-medium text-text-1">
          {showAll ? 'Show 5 preview' : 'View all memories'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{preview.map((memory) => <MemoryCard key={memory.id} memory={memory} />)}</div>
      {showAll && hasMore ? <button type="button" onClick={() => void load(memories.length)} disabled={loadingMore} className="rounded-xl border border-accent-1/25 px-4 py-2 text-sm text-text-1">{loadingMore ? 'Loading…' : 'Load more'}</button> : null}
    </div>
  )
}

export default memo(AllMemories)
