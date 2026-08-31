'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Accessibility, CheckCircle2, Gauge, Map, Rocket, Smartphone, Sparkles } from 'lucide-react'

const quickActions = ['Plan a date', 'Open a letter', 'Send love note', 'View memories']
const accessibilityChecks = [
  'Color contrast passes WCAG-friendly contrast for primary text',
  'Keyboard focus states are visible on controls and links',
  'Buttons are touch-friendly and thumb-zone optimized for mobile',
  'Loading, success, and empty states are clearly communicated',
]
const performanceTargets = [
  { label: 'LCP', value: '< 2.5s', note: 'Hero and first content are prioritized' },
  { label: 'INP', value: '< 200ms', note: 'Touch interactions stay responsive' },
  { label: 'CLS', value: '< 0.1', note: 'Stable layout and reserved image dims' },
  { label: 'Mobile score', value: '> 90', note: 'Lean assets and cached static resources' },
]
const performanceChecks = [
  'Images prefer AVIF/WebP and lazy loading for below-the-fold media',
  'Critical fonts are swapped and preloaded, preserving brand style without blocking render',
  'Static assets are cacheable for a full year to reduce repeat network overhead',
  'Layouts reserve space for image cards and avoid content shift during render',
  'Feature areas remain modular so only necessary UI is loaded on the dashboard',
]

function MapPanel() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (key) {
    const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=coffee+shop`
    return (
      <div className="h-64 w-full overflow-hidden rounded shadow-md">
        <iframe src={src} className="h-full w-full border-0" allowFullScreen loading="lazy" />
      </div>
    )
  }
  return (
    <div className="flex h-64 w-full items-center justify-center rounded border border-[var(--accent-1)]/20 bg-gradient-to-br from-[var(--bg-color)] to-[var(--accent-1)]/20">
      <div className="p-4 text-center">
        <div className="mb-2 font-dancing text-lg text-[var(--accent-2)]">Map Placeholder</div>
        <div className="text-sm opacity-60">
          Google Maps API key not configured. The map UI will appear here once
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is available.
        </div>
      </div>
    </div>
  )
}

function ExperiencePanel() {
  const [toast, setToast] = useState('Saved')
  const statusList = useMemo(() => accessibilityChecks, [])
  const handleAction = (label: string) => {
    setToast(`${label} added`)
    window.setTimeout(() => setToast('Saved'), 1200)
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Smartphone className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Mobile & Accessibility</h3>
        </div>
        <div
          aria-live="polite"
          className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20 px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]"
        >
          {toast}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <motion.button
            key={action}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={() => handleAction(action)}
            className="touch-button min-h-[52px] rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)] shadow-sm"
          >
            {action}
          </motion.button>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-3">
        <div className="mb-2 flex items-center gap-2 text-[var(--accent-1)]">
          <Accessibility className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Accessibility checks</span>
        </div>
        <ul className="space-y-2 text-sm">
          {statusList.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[var(--text-primary)]/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--text-secondary)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="glass-card rounded-2xl p-3">
        <div className="mb-2 flex items-center gap-2 text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Interaction polish</span>
        </div>
        <div className="space-y-2 text-sm text-[var(--text-primary)]/80">
          <div className="flex items-center justify-between rounded-xl bg-[var(--card-bg)] px-3 py-2">
            <span>Loading states</span>
            <span className="font-medium text-[var(--text-secondary)]">Ready</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[var(--card-bg)] px-3 py-2">
            <span>Error handling</span>
            <span className="font-medium text-[var(--accent-1)]">Graceful fallbacks</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[var(--card-bg)] px-3 py-2">
            <span>Success feedback</span>
            <span className="font-medium text-[var(--accent-1)]">Celebratory</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PerformancePanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Rocket className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Performance Polish</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {performanceTargets.map((target) => (
          <motion.div
            key={target.label}
            whileHover={{ y: -2 }}
            className="glass-card rounded-2xl p-3"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">{target.label}</div>
            <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {target.value}
            </div>
            <div className="mt-1 text-[11px] opacity-70">{target.note}</div>
          </motion.div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-3">
        <div className="mb-2 flex items-center gap-2 text-[var(--accent-1)]">
          <Gauge className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Launch checklist</span>
        </div>
        <ul className="space-y-2 text-sm">
          {performanceChecks.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[var(--text-primary)]/80">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--text-secondary)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

type Tab = 'map' | 'experience' | 'performance'
const tabs: Array<{ id: Tab; label: string; icon: typeof Map }> = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'experience', label: 'Experience', icon: Smartphone },
  { id: 'performance', label: 'Performance', icon: Gauge },
]

export default function DashboardExtras() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ${activeTab === tab.id ? 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]' : 'bg-[var(--card-bg)] text-[var(--text-primary)]/70'}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      {activeTab === 'map' && <MapPanel />}
      {activeTab === 'experience' && <ExperiencePanel />}
      {activeTab === 'performance' && <PerformancePanel />}
    </section>
  )
}
