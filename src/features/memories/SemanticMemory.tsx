'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function SemanticMemory() {
  const [facts, setFacts] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai-semantic') || ''
      setFacts(raw)
    } catch (e) {}
  }, [])

  const save = () => {
    try {
      localStorage.setItem('ai-semantic', facts)
      alert('Saved semantic memory (local).')
    } catch (e) {
      alert('Failed to save.')
    }
  }

  const clearAll = () => {
    if (!confirm('Clear all semantic memory?')) return
    try {
      localStorage.removeItem('ai-semantic')
      setFacts('')
      alert('Cleared.')
    } catch (e) {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <h3 className="font-dancing text-lg text-[var(--accent-2)] mb-2">Semantic Memory</h3>
      <p className="text-sm opacity-70 mb-2">
        Facts about the couple (favorites, birthdays). Stored locally for AI to reference.
      </p>

      <textarea
        value={facts}
        onChange={(e) => setFacts(e.target.value)}
        className="w-full h-28 p-2 rounded bg-[var(--card-bg)]/60"
        placeholder={
          'e.g.\nHer favorite color: Soft Pink\nFavorite song: Our Melody\nTogether since: 2021-06-12'
        }
      />
      <div className="flex gap-2 mt-2">
        <button onClick={save} className="glass-button px-3 py-1">
          Save Facts
        </button>
        <button onClick={clearAll} className="px-3 py-1 bg-[var(--card-bg)]/60 rounded">
          Clear
        </button>
      </div>
    </motion.div>
  )
}
