'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { getCoupleStatus } from '@/lib/couples'
import TelegramImport from '@/features/our-story/TelegramImport'

const TabSkeleton = () => <div className="h-96 animate-pulse rounded-panel bg-card" />
const Timeline = dynamic(() => import('@/features/our-story/Timeline'), { loading: TabSkeleton })
const AllMemories = dynamic(() => import('@/features/our-story/AllMemories'), { loading: TabSkeleton })
const Categories = dynamic(() => import('@/features/our-story/Categories'), { loading: TabSkeleton })
const ImportedTelegramMessages = dynamic(() => import('@/features/our-story/ImportedTelegramMessages'), { loading: TabSkeleton })

export default function OurStoryContent() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getCoupleStatus()
      .then((status) => setCoupleId(status.couple?.id ?? null))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load your shared story.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 p-4 md:p-6"
    >
      <header className="rounded-panel border border-accent-1/15 bg-card p-6 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <AnimatedIcon name="BookHeart" animation="bounce" trigger="hover" size={24} className="text-accent-1" />
          <div>
            <h1 className="text-2xl font-semibold text-text-1">Our Story</h1>
            <p className="mt-1 text-sm text-text-2">Every memory we&apos;ve made together</p>
          </div>
        </div>
      </header>

      {loading ? <div className="h-64 animate-pulse rounded-panel bg-card" /> : error ? (
        <div className="rounded-panel border border-rose-400/30 p-6 text-rose-300">{error}</div>
      ) : !coupleId ? (
        <div className="rounded-panel border border-dashed border-accent-1/25 p-10 text-center text-text-2">Link with your partner to see your shared story.</div>
      ) : (
        <>
          <TelegramImport coupleId={coupleId} />
          <Timeline coupleId={coupleId} />
          <AllMemories coupleId={coupleId} initialCategory="all" />
          <Categories coupleId={coupleId} onOpenCategory={() => undefined} />
          <details className="rounded-panel border border-accent-1/15 bg-card p-5">
            <summary className="cursor-pointer font-semibold text-text-1">Telegram archive</summary>
            <p className="mt-2 text-sm text-text-2">Imported Telegram messages stay available here without crowding the shared timeline.</p>
            <div className="mt-4"><ImportedTelegramMessages coupleId={coupleId} /></div>
          </details>
        </>
      )}
    </motion.main>
  )
}
