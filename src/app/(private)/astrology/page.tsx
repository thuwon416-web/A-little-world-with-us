'use client'

import { Sparkles } from 'lucide-react'
import CompatibilityScore from '@/features/astro/CompatibilityScore'
import DailyHoroscope from '@/features/astro/DailyHoroscope'
import MonthlyForecast from '@/features/astro/MonthlyForecast'
import MoonPhase from '@/features/astro/MoonPhase'
import RetrogradeAlert from '@/features/astro/RetrogradeAlert'

export default function AstrologyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Cosmic Connection</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Astrology</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-[var(--accent-1)]/10 px-4 py-2 text-sm text-[var(--accent-1)]">
          <Sparkles className="h-4 w-4" />
          <span>Myanmar Astrology</span>
        </div>
      </div>

      {/* Retrograde Alert - Full Width */}
      <RetrogradeAlert />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          <CompatibilityScore />
          <MoonPhase />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <DailyHoroscope />
          <MonthlyForecast />
        </div>
      </div>
    </div>
  )
}
