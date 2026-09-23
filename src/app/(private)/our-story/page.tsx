'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Heart, Layers, MessageCircle, Sparkles } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { getCoupleStatus } from '@/lib/couples'
import TelegramImport from '@/features/our-story/TelegramImport'

type Tab = 'timeline' | 'all' | 'categories' | 'telegram'

const TabSkeleton = () => <div className="h-96 animate-pulse rounded-panel bg-card" />
const Timeline = dynamic(() => import('@/features/our-story/Timeline'), { loading: TabSkeleton })
const AllMemories = dynamic(() => import('@/features/our-story/AllMemories'), { loading: TabSkeleton })
const Categories = dynamic(() => import('@/features/our-story/Categories'), { loading: TabSkeleton })
const ImportedTelegramMessages = dynamic(() => import('@/features/our-story/ImportedTelegramMessages'), { loading: TabSkeleton })

export default function OurStoryPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('timeline')
  const [categoryFilter, setCategoryFilter] = useState('all')
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
          <nav className="flex flex-wrap gap-2" aria-label="Our Story sections" role="tablist">
            {([
              ['timeline', 'Timeline', Sparkles],
              ['all', 'All Memories', Heart],
              ['categories', 'Categories', Layers],
              ['telegram', 'Telegram', MessageCircle],
            ] as const).map(([value, label, Icon]) => (
              <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition ${tab === value ? 'bg-accent-1/15 text-accent-1' : 'text-text-2 hover:bg-soft-tint'}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
          {tab === 'timeline' ? <Timeline coupleId={coupleId} /> : null}
          {tab === 'all' ? <AllMemories coupleId={coupleId} initialCategory={categoryFilter} /> : null}
          {tab === 'categories' ? <Categories coupleId={coupleId} onOpenCategory={(category) => { setCategoryFilter(category); setTab('all') }} /> : null}
          {tab === 'telegram' ? <ImportedTelegramMessages coupleId={coupleId} /> : null}
        </>
      )}
    </motion.main>
  )
}
