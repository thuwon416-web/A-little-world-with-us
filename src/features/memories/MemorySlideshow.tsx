'use client'
/* eslint-disable @next/next/no-img-element -- signed Supabase URLs are remote and expire. */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
type SlideshowMemory = {
  id: string
  title?: string | null
  caption: string | null
  date: string
  image_url: string | null
  storage_path?: string | null
  displayUrl?: string
}

type Props = {
  memories: SlideshowMemory[]
  onClose: () => void
}

const speeds = [3, 5, 10] as const

export default function MemorySlideshow({ memories, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState<(typeof speeds)[number]>(5)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const photos = useMemo(
    () => memories.filter((memory) => memory.image_url || memory.displayUrl),
    [memories]
  )

  useEffect(() => {
    let mounted = true
    const resolveUrls = async () => {
      const entries = await Promise.all(
        photos.map(async (memory) => {
          if (memory.displayUrl) return [memory.id, memory.displayUrl] as const
          if (memory.image_url?.startsWith('/')) return [memory.id, memory.image_url] as const
          const path = memory.storage_path ?? memory.image_url
          if (!path) return null
          const { data, error: signedError } = await supabase.storage
            .from('memories')
            .createSignedUrl(path, 60 * 60)
          if (signedError || !data?.signedUrl) return null
          return [memory.id, data.signedUrl] as const
        })
      )
      if (!mounted) return
      const resolved = Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null))
      setUrls(resolved)
      if (photos.length && !Object.keys(resolved).length) setError('Unable to load slideshow photos.')
    }
    void resolveUrls()
    return () => {
      mounted = false
    }
  }, [photos])

  useEffect(() => {
    if (!playing || photos.length < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % photos.length), speed * 1000)
    return () => window.clearInterval(timer)
  }, [photos.length, playing, speed])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + photos.length) % photos.length)
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % photos.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, photos.length])

  if (!photos.length) return null
  const current = photos[index]
  const currentUrl = urls[current.id]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Memory slideshow">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white" aria-label="Close slideshow">
        <X className="h-5 w-5" />
      </button>
      <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-5">
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <button type="button" onClick={() => setIndex((value) => (value - 1 + photos.length) % photos.length)} className="absolute left-0 z-10 rounded-full bg-white/10 p-3 text-white" aria-label="Previous photo">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.35 }} className="flex h-full w-full items-center justify-center">
              {currentUrl ? <img src={currentUrl} alt={current.title || 'Memory'} className="max-h-full max-w-[85%] rounded-2xl object-contain" /> : <p className="text-sm text-white/70">Loading photo…</p>}
            </motion.div>
          </AnimatePresence>
          <button type="button" onClick={() => setIndex((value) => (value + 1) % photos.length)} className="absolute right-0 z-10 rounded-full bg-white/10 p-3 text-white" aria-label="Next photo">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="w-full max-w-2xl text-center text-white">
          <p className="text-lg font-semibold">{current.title || 'A memory together'}</p>
          {current.caption && current.caption !== current.title ? <p className="mt-1 text-sm text-white/75">{current.caption}</p> : null}
          <p className="mt-1 text-xs text-white/60">{current.date} · {index + 1} / {photos.length}</p>
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setPlaying((value) => !value)} className="rounded-full bg-white/10 p-2 text-white" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex gap-1.5" aria-label="Slideshow progress">
              {photos.map((photo, photoIndex) => <button key={photo.id} type="button" onClick={() => setIndex(photoIndex)} className={`h-1.5 rounded-full transition-all ${photoIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} aria-label={`Show photo ${photoIndex + 1}`} />)}
            </div>
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value) as (typeof speeds)[number])} className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white" aria-label="Slideshow speed">
              {speeds.map((value) => <option key={value} value={value} className="text-black">{value}s</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
