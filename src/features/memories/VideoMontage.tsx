'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { readRows } from '@/lib/supabase'

function VideoItem({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setVisible(true)
            obs.disconnect()
          }
        })
      },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="rounded overflow-hidden">
      {visible ? (
        <video className="w-full rounded" src={src} controls playsInline preload="metadata" />
      ) : (
        <div className="w-full h-40 bg-[var(--card-bg)]/10 flex items-center justify-center">
          Loading preview…
        </div>
      )}
    </div>
  )
}

export default function VideoMontage() {
  const [videos, setVideos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await readRows<{ path: string }>('videos', 'id, path', {
          column: 'id',
          ascending: false,
        })
        if (data.length && mounted) {
          const urls = data.map((d) => d.path)
          setVideos(urls)
          setLoading(false)
          return
        }
      } catch (e) {}

      const raw = process.env.NEXT_PUBLIC_VIDEO_URLS
      if (raw && mounted) setVideos(raw.split(',').map((s) => s.trim()))
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div className="p-4">Loading montage…</div>
  if (!videos.length)
    return (
      <div className="p-4 opacity-60">
        No video sources found. Upload a montage video or configure NEXT_PUBLIC_VIDEO_URLS
        comma-separated.
      </div>
    )

  return (
    <div className="space-y-3">
      {videos.map((v, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded overflow-hidden"
        >
          <VideoItem src={v} />
        </motion.div>
      ))}
    </div>
  )
}
