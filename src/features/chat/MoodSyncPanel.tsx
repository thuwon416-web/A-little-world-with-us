'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, SmilePlus } from 'lucide-react'

const moods = ['😊 Happy', '😌 Calm', '💞 Romantic', '😴 Tired', '😕 Stressed'] as const

export default function MoodSyncPanel() {
  const [selectedMood, setSelectedMood] = useState<(typeof moods)[number]>('😊 Happy')
  const [partnerMood, setPartnerMood] = useState<(typeof moods)[number]>('💞 Romantic')
  const [syncScore, setSyncScore] = useState(84)

  useEffect(() => {
    const storedMood = localStorage.getItem('our-forever-mood') as (typeof moods)[number] | null
    const storedPartnerMood = localStorage.getItem('our-forever-partner-mood') as
      | (typeof moods)[number]
      | null
    if (storedMood) setSelectedMood(storedMood)
    if (storedPartnerMood) setPartnerMood(storedPartnerMood)
  }, [])

  useEffect(() => {
    localStorage.setItem('our-forever-mood', selectedMood)
    localStorage.setItem('our-forever-partner-mood', partnerMood)

    const moodMap = {
      '😊 Happy': 3,
      '😌 Calm': 2,
      '💞 Romantic': 4,
      '😴 Tired': 1,
      '😕 Stressed': 1,
    }
    const compatibility = Math.min(
      99,
      Math.max(55, (moodMap[selectedMood] ?? 2) * 18 + (moodMap[partnerMood] ?? 2) * 12)
    )
    setSyncScore(compatibility)
  }, [selectedMood, partnerMood])

  const moodSummary = useMemo(() => {
    if (syncScore > 88) return 'Harmony is glowing today.'
    if (syncScore > 70) return 'The rhythm is steady and beautiful.'
    return 'A gentle check-in could bring you closer again.'
  }, [syncScore])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <SmilePlus className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Mood Sync</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-[var(--card-bg)] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">You</div>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value as (typeof moods)[number])}
            className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/40 p-2 text-sm outline-none"
          >
            {moods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl bg-[var(--card-bg)] p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">Partner</div>
          <select
            value={partnerMood}
            onChange={(e) => setPartnerMood(e.target.value as (typeof moods)[number])}
            className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/40 p-2 text-sm outline-none"
          >
            {moods.map((mood) => (
              <option key={mood} value={mood}>
                {mood}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-70">Love meter</span>
          <span className="font-semibold text-[var(--text-primary)]">{syncScore}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[var(--accent-1)]/20 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${syncScore}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
          />
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-primary)]/80">
          <Heart className="w-4 h-4 text-[var(--accent-1)]" />
          {moodSummary}
        </div>
      </div>
    </div>
  )
}
