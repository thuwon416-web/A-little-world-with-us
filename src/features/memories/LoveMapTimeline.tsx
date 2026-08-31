'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPinned, Sparkles } from 'lucide-react'

type MemoryPoint = {
  id: string
  label: string
  place: string
  year: string
  accent: string
}

const defaultPoints: MemoryPoint[] = [
  {
    id: 'p1',
    label: 'Our first coffee together',
    place: 'Old Town Café',
    year: '2022',
    accent: 'from-[var(--accent-1)] to-[var(--accent-1)]',
  },
  {
    id: 'p2',
    label: 'Late-night walk',
    place: 'River Lane',
    year: '2023',
    accent: 'from-[var(--accent-2)] to-[var(--accent-2)]',
  },
  {
    id: 'p3',
    label: 'Sunrise picnic',
    place: 'Hillview Park',
    year: '2024',
    accent: 'from-[var(--accent-1)] to-[var(--accent-1)]',
  },
  {
    id: 'p4',
    label: 'Dream trip plan',
    place: 'Coastal Road',
    year: '2025',
    accent: 'from-[var(--accent-1)] to-[var(--accent-1)]',
  },
]

export default function LoveMapTimeline() {
  const [points] = useState(defaultPoints)
  const [activeId, setActiveId] = useState(defaultPoints[0]?.id ?? '')

  const activePoint = useMemo(
    () => points.find((point) => point.id === activeId) ?? points[0] ?? null,
    [activeId, points]
  )

  if (!activePoint) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <MapPinned className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Map Timeline</h3>
      </div>

      <div className="space-y-3">
        {points.map((point) => (
          <motion.button
            key={point.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveId(point.id)}
            className={`relative w-full overflow-hidden rounded-2xl border p-3 text-left transition ${
              activeId === point.id
                ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]'
            }`}
          >
            <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${point.accent}`} />
            <div className="ml-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {point.label}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
                  {point.year}
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--text-primary)]/70">{point.place}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Highlighted memory
        </div>
        <p>
          <span className="font-medium">{activePoint.label}</span> — {activePoint.place}
        </p>
      </div>
    </div>
  )
}
