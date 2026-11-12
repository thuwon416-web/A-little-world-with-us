'use client'

import { BookHeart } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { calculateDaysTogether } from '@/lib/relationship-days'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import { useLanguage } from '@/contexts/LanguageContext'

function OurStats({ coupleId }: { coupleId: string }) {
  const { t } = useLanguage()
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
        <p className="dashboard-kicker">{t('dashboard.widgets.ourStats')}</p>
        <div className="mt-3">
          <EmptyState
            icon={BookHeart}
            title={t('dashboard.noStats')}
            description={t('dashboard.uploadMemories')}
          />
        </div>
      </section>
    )
  }

  const cards = [
    [t('dashboard.totalMemories'), total],
    [t('dashboard.relationship.daysTogether'), calculateDaysTogether()],
    [t('dashboard.loveExpressions'), stats.emotional_expressions ?? 0],
    [t('dashboard.promises'), stats.promises ?? 0],
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
