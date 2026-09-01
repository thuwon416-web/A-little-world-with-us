'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react'

const memoryPrompts = [
  'On this day last year, we were just beginning to feel how natural it was to choose each other again and again.',
  'This day reminds me of the first time we laughed so hard we forgot what we were even talking about.',
  'I still think about that tiny moment when everything felt simple, warm, and wonderfully us.',
  'This date always makes me remember how safe, happy, and deeply loved I felt in your presence.',
]

export default function MemoryOfTheDay() {
  const [memory, setMemory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('a-little-world-with-us-memory-of-day')
      if (stored) {
        setMemory(stored)
        setIsLoading(false)
        return
      }

      const daySeed = new Date().getDate() % memoryPrompts.length
      const selectedPrompt = memoryPrompts[daySeed] ?? memoryPrompts[0] ?? ''
      setMemory(selectedPrompt)
    } catch {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!memory) return
    localStorage.setItem('a-little-world-with-us-memory-of-day', memory)
  }, [memory])

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }, [])

  const showEmptyState = !isLoading && !memory && !hasError

  return (
    <div className="dashboard-card-interactive dashboard-card-glow dashboard-fade-in space-y-4 rounded-[1.5rem] p-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <CalendarDays className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Memory of the Day</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="dashboard-shimmer h-4 w-20 rounded-full" />
          <div className="dashboard-shimmer h-20 w-full rounded-2xl" />
          <div className="dashboard-shimmer h-10 w-32 rounded-full" />
        </div>
      ) : showEmptyState || hasError ? (
        <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/50 p-4">
          <p className="text-sm text-[var(--text-primary)]">No memory today yet</p>
          <Link
            href="/memories"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/25 bg-[var(--accent-1)]/10 px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
          >
            Add one
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-3">
          <div className="mb-2 flex items-center gap-2 text-[var(--accent-1)]">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-[0.2em]">{todayLabel}</span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]/80">{memory}</p>
          <div className="mt-4">
            <Link
              href="/memories"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/25 bg-[var(--accent-1)]/10 px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
            >
              Open memory
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
