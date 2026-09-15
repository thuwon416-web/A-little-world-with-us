'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Sparkles } from 'lucide-react'

const pulseOptions = [
  { id: 'strong', label: 'Strong', note: 'You are both deeply present today.' },
  { id: 'balanced', label: 'Balanced', note: 'Things feel steady and warm.' },
  { id: 'tender', label: 'Tender', note: 'The softness is showing.' },
  { id: 'drifting', label: 'Drifting', note: 'A little room and patience can help.' },
] as const

type PulseId = (typeof pulseOptions)[number]['id']

export default function ConnectionPulse() {
  const [selected, setSelected] = useState<PulseId>('strong')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('connection-pulse')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'string') {
          const valid = pulseOptions.some((option) => option.id === parsed)
          if (valid) setSelected(parsed as PulseId)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('connection-pulse', JSON.stringify(selected))
  }, [selected])

  const active = pulseOptions.find((option) => option.id === selected) ?? pulseOptions[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Activity className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Connection Pulse</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {pulseOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelected(option.id)}
            className={`rounded-2xl border px-3 py-2 text-sm transition ${
              selected === option.id
                ? 'border-[var(--accent-1)]/20 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 text-[var(--text-primary)]/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <motion.div
        key={selected}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80"
      >
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Today’s pulse
        </div>
        <p>{active.note}</p>
      </motion.div>
    </div>
  )
}
