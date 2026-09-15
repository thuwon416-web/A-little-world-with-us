'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { supabase, type Memory } from '@/lib/supabase'

const Map = dynamic(() => import('@/features/memories/MemoryMap'), { ssr: false, loading: () => <div className="h-[70vh] animate-pulse rounded-3xl bg-[var(--bg-2)]" /> })

export default function MemoryMapPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    void supabase.from('memories').select('*').not('latitude', 'is', null).not('longitude', 'is', null).order('date', { ascending: false }).then(({ data, error: loadError }) => {
      if (loadError) setError(loadError.message)
      else setMemories((data ?? []) as Memory[])
    })
  }, [])
  return <main className="mx-auto max-w-6xl space-y-5 px-4 py-8"><h1 className="text-3xl font-serif text-[var(--text-primary)]">Memory Map</h1>{error ? <p className="text-sm text-red-400">{error}</p> : memories.length ? <Map memories={memories} /> : <section className="glass-card flex min-h-64 items-center justify-center rounded-3xl p-6 text-center text-[var(--text-secondary)]">No located memories yet.</section>}</main>
}
