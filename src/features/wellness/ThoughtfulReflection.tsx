'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { NotebookText, Sparkles } from 'lucide-react'

type Reflection = {
  id: string
  title: string
  text: string
}

const starterReflections: Reflection[] = [
  {
    id: 'r1',
    title: 'Today felt soft',
    text: 'I loved the way we stayed connected through the small moments.',
  },
  {
    id: 'r2',
    title: 'What I want more of',
    text: 'I want more quiet dinners, slower walks, and warm laughter.',
  },
]

export default function ThoughtfulReflection() {
  const [items, setItems] = useState<Reflection[]>(starterReflections)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('thoughtful-reflection')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setItems(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('thoughtful-reflection', JSON.stringify(items))
  }, [items])

  const addReflection = () => {
    const valueTitle = title.trim()
    const valueText = text.trim()
    if (!valueTitle || !valueText) return

    setItems((current) => [
      ...current,
      { id: `reflection-${Date.now()}`, title: valueTitle, text: valueText },
    ])
    setTitle('')
    setText('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <NotebookText className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Thoughtful Reflections</h3>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-3"
          >
            <div className="font-medium text-[var(--text-primary)]">{item.title}</div>
            <p className="mt-1 text-sm text-[var(--text-primary)]/75">{item.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Reflection title"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="What do you want to remember, notice, or hold onto?"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <button onClick={addReflection} className="glass-button px-3 py-2 text-sm w-full">
          Save reflection
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Gentle nudge
        </div>
        <p>Sometimes the most loving thing is noticing what is already good and letting it stay.</p>
      </div>
    </div>
  )
}
