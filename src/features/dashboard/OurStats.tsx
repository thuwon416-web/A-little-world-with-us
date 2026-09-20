'use client'

import { BookHeart } from 'lucide-react'
import { memo } from 'react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { calculateDaysTogether } from '@/lib/relationship-days'
import { relationshipMemoriesService } from '@/services/relationship-memories'

function OurStats({ coupleId }: { coupleId: string }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    relationshipMemoriesService
      .getStats(coupleId)
      .then(setStats)
      .catch(() => setStats({}))
  }, [coupleId])

  if (stats === null) {
    return <div className="h-40 animate-pulse rounded-panel bg-card" />
  }

  const total = Object.values(stats).reduce((sum, count) => sum + count, 0)
  if (!total) {
    return (
      <section className="glass-card dashboard-panel rounded-btn p-6">
        <p className="dashboard-kicker">Our Stats</p>
        <div className="mt-3">
          <EmptyState
            icon={BookHeart}
            title="No stats yet"
            description="Upload memories to see how your story grows over time."
          />
        </div>
      </section>
    )
  }

  const cards = [
    ['Total Memories', total],
    ['Days Together', calculateDaysTogether()],
    ['Love Expressions', stats.emotional_expressions ?? 0],
    ['Promises', stats.promises ?? 0],
  ]
  return (
    <section className="glass-card dashboard-panel rounded-btn p-6">
      <div className="flex items-center justify-between">
        <p className="dashboard-kicker">Our Stats</p>
        <Link href="/our-story" className="text-xs text-accent-1">
          View All
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-btn bg-card/70 p-3">
            <p className="text-xs text-text-2">{label}</p>
            <p className="mt-1 text-xl font-semibold text-text-1">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default memo(OurStats)
