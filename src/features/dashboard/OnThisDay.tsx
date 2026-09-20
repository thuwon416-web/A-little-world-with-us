'use client'
/* eslint-disable @next/next/no-img-element -- signed Supabase thumbnails are runtime URLs. */

import { BookHeart, Cake, Camera, Heart, HeartCrack, Handshake, MessageCircle, Sparkles, Star, type LucideIcon } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import { supabase, type Memory } from '@/lib/supabase'
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

type UnifiedMemory = {
  source: 'photo' | 'chat'
  id: string
  title: string
  date: string
  yearsAgo: number
  imageUrl?: string
  quote?: string
  context?: string
  category?: string
}

function OnThisDay({ coupleId }: { coupleId: string }) {
  const [memories, setMemories] = useState<UnifiedMemory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const today = new Date()
    const load = async () => {
      const [chatResult, photoResult] = await Promise.allSettled([
        relationshipMemoriesService.getOnThisDay(coupleId, today),
        supabase.from('memories').select('*').eq('couple_id', coupleId),
      ])
      const chatItems: UnifiedMemory[] =
        chatResult.status === 'fulfilled'
          ? chatResult.value.map((memory: RelationshipMemory) => ({
              source: 'chat',
              id: memory.id,
              title: memory.category,
              date: memory.date_time,
              yearsAgo: yearsAgo(memory.date_time),
              quote: memory.quote_burmese ?? undefined,
              context: memory.context ?? undefined,
              category: memory.category,
            }))
          : []
      const photoRows: Memory[] =
        photoResult.status === 'fulfilled' && !photoResult.value.error
          ? ((photoResult.value.data ?? []) as Memory[])
          : []
      const photoItems = await Promise.all(
        photoRows
          .filter((memory) => {
            const date = new Date(memory.date)
            return date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
          })
          .map(async (memory): Promise<UnifiedMemory> => {
            const path = memory.storage_path ?? memory.image_url
            let imageUrl: string | undefined
            if (path?.startsWith('/')) imageUrl = path
            else if (path) {
              const { data } = await supabase.storage.from('memories').createSignedUrl(path, 3600)
              imageUrl = data?.signedUrl
            }
            return {
              source: 'photo',
              id: memory.id,
              title: memory.title ?? memory.caption ?? 'A memory together',
              date: memory.date,
              yearsAgo: yearsAgo(memory.date),
              imageUrl,
              category: memory.category ?? undefined,
            }
          })
      )
      if (mounted) {
        setMemories([...chatItems, ...photoItems].sort((a, b) => b.yearsAgo - a.yearsAgo).slice(0, 3))
        setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [coupleId])

  const visibleMemories = useMemo(() => memories.slice(0, 3), [memories])

  return (
    <section className="glass-card dashboard-panel rounded-btn p-6">
      <p className="dashboard-kicker">On This Day</p>
      {loading ? (
        <div className="mt-3 h-20 animate-pulse rounded-btn bg-card" />
      ) : memories.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            icon={BookHeart}
            title="No memories from this day yet"
            description="Add more shared moments to keep the timeline alive."
          />
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {visibleMemories.map((memory) => (
            <article key={memory.id} className="border-l-2 border-accent-1/40 pl-3">
              <p className="text-xs text-text-2">
                  {memory.yearsAgo} years ago today
              </p>
              {(() => {
                  const Icon = memory.source === 'photo' ? Camera : icons[memory.category ?? ''] ?? MessageCircle
                return <Icon size={20} aria-hidden="true" className="mt-1 text-accent-1" />
              })()}
                {memory.source === 'photo' ? (
                  <div className="mt-2 flex items-center gap-3">
                    {memory.imageUrl ? <img src={memory.imageUrl} alt="" className="h-14 w-14 rounded-xl object-cover" /> : null}
                    <p className="text-sm text-text-1">{memory.title}</p>
                  </div>
                ) : memory.quote ? (
                  <p className="mt-1 text-sm text-text-1">{memory.quote}</p>
                ) : null}
                {memory.context ? (
                <p className="mt-1 text-xs leading-relaxed text-text-2">
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
