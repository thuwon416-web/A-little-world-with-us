'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ListTodo, Plus, Sparkles } from 'lucide-react'

type BucketItem = {
  id: string
  label: string
  done: boolean
  progress: number
  target: string
}

const starterList: BucketItem[] = [
  {
    id: 'b1',
    label: 'Take a road trip together',
    done: false,
    progress: 30,
    target: 'Route planned',
  },
  {
    id: 'b2',
    label: 'Watch the sunrise somewhere new',
    done: true,
    progress: 60,
    target: '2/3 trips planned',
  },
  {
    id: 'b3',
    label: 'Have a tiny home-cooked feast',
    done: false,
    progress: 15,
    target: 'New plan',
  },
]

export default function BucketList() {
  const [items, setItems] = useState<BucketItem[]>(starterList)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const stored =
      localStorage.getItem('shared-bucket-list') || localStorage.getItem('a-little-world-with-us-bucket-list')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setItems(
          parsed.map((item) => ({
            id: String(item.id),
            label: item.label ?? item.title,
            done: item.done ?? item.progress >= 100,
            progress: item.progress ?? (item.done ? 100 : 0),
            target: item.target ?? 'New plan',
          }))
        )
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('shared-bucket-list', JSON.stringify(items))
  }, [items])

  const totalProgress = useMemo(() => {
    const doneCount = items.filter((item) => item.done).length
    return items.length ? Math.round((doneCount / items.length) * 100) : 0
  }, [items])

  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    setItems((prev) => [
      ...prev,
      { id: `bucket-${Date.now()}`, label: value, done: false, progress: 15, target: 'New plan' },
    ])
    setDraft('')
  }

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, done: !item.done, progress: item.done ? Math.min(item.progress, 99) : 100 }
          : item
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <ListTodo className="w-5 h-5" />
          <h3 className="font-dancing text-2xl">Shared Bucket List</h3>
        </div>
        <div className="rounded-full bg-[var(--card-bg)] px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
          {totalProgress}% done
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ y: -2 }}
            onClick={() => toggleItem(item.id)}
            className={`w-full rounded-2xl border p-3 text-left ${item.done ? 'border-[var(--accent-1)]/20 bg-[var(--accent-2)]/20' : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25'}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-[var(--text-primary)]">{item.label}</div>
              <span className="flex items-center gap-2 text-[9px] uppercase tracking-[0.18em]">
                <CheckCircle2 className={`h-4 w-4 ${item.done ? 'fill-current' : ''}`} />
                {item.done ? 'done' : 'next'}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--card-bg)]/40 overflow-hidden">
              <motion.div
                animate={{ width: `${item.progress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]"
              />
            </div>
            <div className="mt-2 text-[11px] opacity-60">{item.target}</div>
          </motion.button>
        ))}
      </div>

      <div className="space-y-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a shared dream"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <button
          onClick={addItem}
          className="glass-button flex w-full items-center justify-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" /> Add to list
        </button>
      </div>
      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-1)] p-3 text-sm">
        <div className="mb-1 flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4" />
          Shared promise
        </div>
        <p>Life is richer when you make room for adventures, even the small ones.</p>
      </div>
    </div>
  )
}
