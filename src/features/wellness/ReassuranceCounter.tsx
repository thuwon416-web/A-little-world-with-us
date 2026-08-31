'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { HeartHandshake, Plus, Sparkles } from 'lucide-react'

const starterMessages = [
  'I am here with you.',
  'I am proud of us.',
  'I love the way we grow together.',
]

export default function ReassuranceCounter() {
  const [messages, setMessages] = useState<string[]>(starterMessages)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('reassurance-counter')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('reassurance-counter', JSON.stringify(messages))
  }, [messages])

  const count = useMemo(() => messages.length, [messages])

  const addMessage = () => {
    const value = draft.trim()
    if (!value) return
    setMessages((current) => [...current, value])
    setDraft('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <HeartHandshake className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Reassurance Counter</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1)]/20 px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {count} notes
        </div>
      </div>

      <div className="space-y-2">
        {messages.map((message, index) => (
          <motion.div
            key={`${message}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3 text-sm text-[var(--text-primary)]/80"
          >
            {message}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a reassuring line"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button
          onClick={addMessage}
          className="glass-button px-3 py-2 text-sm"
          aria-label="Add reassurance note"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Gentle truth
        </div>
        <p>Reassurance is not about fixing everything. It is about choosing each other gently.</p>
      </div>
    </div>
  )
}
