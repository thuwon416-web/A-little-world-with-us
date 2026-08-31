'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ScavengerHunt({ totalClues = 3 }: { totalClues?: number }) {
  const [found, setFound] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('scavenger-found')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem('scavenger-unlocked') === '1'
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    const onFound = (e: Event) => {
      const d = (e as CustomEvent).detail
      const id = String(d?.id || `clue-${Math.random().toString(36).slice(2, 8)}`)
      setFound((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        try {
          localStorage.setItem('scavenger-found', JSON.stringify(next))
        } catch (err) {}
        if (next.length >= totalClues) {
          try {
            localStorage.setItem('scavenger-unlocked', '1')
          } catch (err) {}
          setUnlocked(true)
        }
        return next
      })
    }

    window.addEventListener('scavenger:found', onFound as EventListener)
    return () => window.removeEventListener('scavenger:found', onFound as EventListener)
  }, [totalClues])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-dancing text-lg text-[var(--accent-2)]">Scavenger Hunt</h3>
        <div className="text-sm opacity-60">
          Progress: {found.length}/{totalClues}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm opacity-70">
          Find hidden hearts across the site. Click each heart to collect a clue. When you collect
          all clues the surprise will be unlocked.
        </p>
      </div>

      <div className="flex gap-2 items-center">
        {found.map((f) => (
          <div key={f} className="px-3 py-1 rounded bg-[var(--accent-1)]/10 text-[13px]">
            {f}
          </div>
        ))}
      </div>

      {unlocked ? (
        <div className="mt-4 p-3 bg-gradient-to-r from-[var(--accent-1)]/10 to-[var(--accent-2)]/6 rounded">
          <div className="font-medium text-[var(--accent-1)]">Surprise unlocked! 🎁</div>
          <div className="text-sm opacity-70">
            You can now visit the secret page in the dashboard.
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm opacity-60">Keep exploring to find all the clues.</div>
      )}
    </motion.div>
  )
}
