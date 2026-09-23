'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { supabase, type Memory } from '@/lib/supabase'
import { EmptyState } from '@/components/ui/empty-state'

const Map = dynamic(() => import('@/features/memories/MemoryMap'), { ssr: false, loading: () => <div className="h-[70vh] animate-pulse rounded-panel bg-soft-tint" /> })

export default function MemoryMapPage() {
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
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('date', { ascending: false })
        if (loadError) throw loadError
        if (active) setMemories((data ?? []) as Memory[])
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Unable to load located memories.')
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
      ) : memories.length ? (
        <Map memories={memories} coupleId={coupleId} />
      ) : (
        <EmptyState icon={MapPin} title="No located memories yet" description="Add a location when you save a memory to place it on your shared map." action={{ label: 'Add a located memory', onClick: () => router.push('/memories') }} />
      )}
    </div>
  )
}
