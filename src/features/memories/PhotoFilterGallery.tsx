'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, SlidersHorizontal } from 'lucide-react'

type FilterPreset = 'Vintage' | 'B&W' | 'Warm' | 'Cool'

const filterStyles: Record<FilterPreset, { label: string; css: string }> = {
  Vintage: { label: 'Vintage', css: 'sepia(0.7) saturate(1.25) hue-rotate(-10deg)' },
  'B&W': { label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  Warm: { label: 'Warm', css: 'contrast(1.15) saturate(1.4) hue-rotate(-12deg)' },
  Cool: { label: 'Cool', css: 'contrast(1.08) saturate(0.9) hue-rotate(10deg)' },
}

const sampleSrc =
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80'

export default function PhotoFilterGallery() {
  const [active, setActive] = useState<FilterPreset>('Vintage')
  const [beforeAfter, setBeforeAfter] = useState(52)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Camera className="w-5 h-5" />
          <h3 className="font-dancing text-2xl">Photo Filters</h3>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-70">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {filterStyles[active].label}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(filterStyles) as FilterPreset[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setActive(preset)}
            className={`rounded-full px-3 py-2 text-[11px] transition-colors ${
              active === preset
                ? 'bg-[var(--accent-1)] text-[var(--text-primary)] shadow-md'
                : 'bg-[var(--card-bg)]/40 text-[var(--text-primary)]'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]">
        <div className="relative aspect-[4/3] select-none">
          <img
            src={sampleSrc}
            alt="Our memory"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: filterStyles[active].css }}
          />

          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${beforeAfter}%` }}
          >
            <img
              src={sampleSrc}
              alt="Before comparison"
              className="h-full w-full object-cover"
              style={{ filter: 'none' }}
            />
          </div>

          <div
            className="absolute inset-y-0 w-[2px] bg-[var(--card-bg)] shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
            style={{ left: `${beforeAfter}%` }}
          />

          <input
            aria-label="Before/After filter compare"
            type="range"
            min={0}
            max={100}
            value={beforeAfter}
            onChange={(e) => setBeforeAfter(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>

      <div className="text-xs opacity-70">
        <span className="font-medium">Before / After</span>
        <div className="mt-1 h-2 rounded-full bg-[var(--card-bg)]/40 overflow-hidden">
          <motion.div
            animate={{ width: `${beforeAfter}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
          />
        </div>
      </div>
    </div>
  )
}
