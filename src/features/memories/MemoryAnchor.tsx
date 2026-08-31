'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Anchor, Sparkles } from 'lucide-react'

type AnchorEntry = {
  id: string
  title: string
  detail: string
}

const starterEntries: AnchorEntry[] = [
  {
    id: 'm1',
    title: 'The place we felt at home',
    detail: 'That one ordinary evening when everything felt warm and easy.',
  },
  {
    id: 'm2',
    title: 'The thing I still remember',
    detail: 'Your hand in mine, the quiet, and the way the world softened.',
  },
]

export default function MemoryAnchor() {
  const [entries, setEntries] = useState<AnchorEntry[]>(starterEntries)
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('memory-anchor')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setEntries(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('memory-anchor', JSON.stringify(entries))
  }, [entries])

  const addEntry = () => {
    const valueTitle = title.trim()
    const valueDetail = detail.trim()
    if (!valueTitle || !valueDetail) return

    setEntries((current) => [
      ...current,
      { id: `anchor-${Date.now()}`, title: valueTitle, detail: valueDetail },
    ])
    setTitle('')
    setDetail('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Anchor className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Memory Anchor</h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3"
          >
            <div className="font-medium text-[var(--text-primary)]">{entry.title}</div>
            <p className="mt-1 text-sm text-[var(--text-primary)]/75">{entry.detail}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Memory title"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <textarea
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          rows={3}
          placeholder="Anchor a memory you want to keep returning to..."
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button onClick={addEntry} className="glass-button px-3 py-2 text-sm w-full">
          Save anchor
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Anchor note
        </div>
        <p>Even the smallest memory can hold the whole feeling of love if you name it with care.</p>
      </div>
    </div>
  )
}
