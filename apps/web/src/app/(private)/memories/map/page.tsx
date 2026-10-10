'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { supabase, type Memory } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/empty-state'

const MemoryMapView = dynamic(() => import('@/features/memories/MemoryMap'), { ssr: false, loading: () => <div className="h-[70vh] animate-pulse rounded-panel bg-soft-tint" /> })

export default function MemoryMapContent() {
  const router = useRouter()
  const [memories, setMemories] = useState<Memory[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const loadData = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        if (!userData.user) return
        const { data: link, error: linkError } = await supabase
          .from('couple_links')
          .select('couple_id')
          .or(`inviter_id.eq.${userData.user.id},accepted_by.eq.${userData.user.id}`)
          .eq('status', 'accepted')
          .maybeSingle()
        if (linkError) throw linkError
        if (!link?.couple_id) return
        if (active) setCoupleId(link.couple_id)
        const { data, error: loadError } = await supabase
          .from('memories')
          .select('*,mime_type')
          .eq('couple_id', link.couple_id)
          .order('date', { ascending: false })
        if (loadError) throw loadError
        if (active) setMemories((data ?? []) as Memory[])
      } catch (error_) {
        if (active) setError(error_ instanceof Error ? error_.message : 'Unable to load located memories.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadData()
    return () => { active = false }
  }, [])
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-serif text-text-1">Memory Map</h1>
      {error ? <p className="rounded-btn border border-error/20 bg-error/10 p-4 text-sm text-error" role="alert">{error}</p> : null}
      {loading ? <div className="h-96 animate-pulse rounded-panel bg-card" aria-label="Loading memory map" /> : !coupleId ? (
        <EmptyState icon={MapPin} title="Link your partner to see your shared map" description="Your located memories will appear here after you connect your accounts." action={{ label: 'Link your partner', onClick: () => router.push('/couple-linking') }} />
      ) : memories.some((memory) => memory.latitude != null && memory.longitude != null) || memories.some((memory) => memory.location_label?.trim()) ? (
        <div className="space-y-4">
          {memories.some((memory) => memory.latitude != null && memory.longitude != null) ? (
            <MemoryMapView
              memories={memories.filter((memory) => memory.latitude != null && memory.longitude != null)}
              coupleId={coupleId}
            />
          ) : (
            <div className="rounded-panel border border-accent-1/15 bg-card p-5">
              <p className="text-sm text-text-2">Some memories have a place name but no map coordinates yet, so they’re shown below rather than pinned.</p>
            </div>
          )}
          {memories.some((memory) => memory.location_label?.trim()) ? (
            <section aria-labelledby="remembered-place-list" className="rounded-panel border border-accent-1/15 bg-card p-5">
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.18em] text-text-2">Saved place names</p>
                <h2 id="remembered-place-list" className="mt-1 font-serif text-xl text-text-1">Places we remember</h2>
                <p className="mt-1 text-sm text-text-2">Includes places saved from memory details and Google Drive folder names.</p>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {[...new Map(memories.filter((memory) => memory.location_label?.trim()).map((memory) => [memory.location_label!.trim().toLocaleLowerCase(), memory])).values()].map((memory) => (
                  <li key={memory.id} className="flex items-start gap-3 rounded-btn border border-border/60 bg-soft-tint p-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-1" />
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-text-1">{memory.location_label}</p>
                      <p className="mt-1 text-xs text-text-2">{memory.title || memory.caption || 'A memory together'} · {memory.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <EmptyState icon={MapPin} title="No places saved yet" description="Add a location to a memory, or sync a Google Drive folder with a place name to start collecting your shared places here." action={{ label: 'Add a memory', onClick: () => router.push('/memories') }} />
      )}
    </div>
  )
}
