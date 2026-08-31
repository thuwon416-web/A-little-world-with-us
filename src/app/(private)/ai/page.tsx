'use client'

import { useMemo, useState } from 'react'
import { Copy, RefreshCcw, Sparkles } from 'lucide-react'

const aiContent = {
  gifts: [
    'A handwritten memory jar with your favorite treats inside.',
    'A cozy date-night basket with candles, snacks, and a tiny framed photo.',
    'A custom playlist + a small keepsake box for your most meaningful moments.',
  ],
  dates: [
    'Stargazing picnic with dessert and a quiet playlist in the park.',
    'Slow morning brunch followed by a bookstore date and a photo walk.',
    'Build a mini adventure: pick a neighborhood and make a playful challenge list.',
  ],
  messages: [
    'I keep thinking about how safe and happy I feel with you. Thank you for being my person.',
    'You make ordinary days feel extra lovely. Can we plan a little adventure this weekend?',
    'I am so grateful for your patience, your laughter, and the way you see me. I love you.',
  ],
} as const

export default function AIFeaturePage() {
  const [tab, setTab] = useState<keyof typeof aiContent>('gifts')
  const [index, setIndex] = useState(0)

  const suggestions = useMemo(() => aiContent[tab], [tab])

  const nextSuggestion = () => {
    setIndex((prev) => (prev + 1) % suggestions.length)
  }

  const currentSuggestion = suggestions[index] ?? suggestions[0] ?? ''

  const copySuggestion = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && currentSuggestion) {
      await navigator.clipboard.writeText(currentSuggestion)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">AI companion</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Love assistant</h1>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--accent-1)]">
          <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI generated</span>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="flex flex-wrap gap-2">
          {Object.keys(aiContent).map((option) => {
            const selected = tab === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTab(option as keyof typeof aiContent)
                  setIndex(0)
                }}
                className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                  selected
                    ? 'bg-[var(--accent-1)] text-[var(--bg-color)]'
                    : 'bg-[var(--card-bg-strong)] text-[var(--text-primary)]'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-[var(--card-bg-strong)] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Suggestion</p>
          <p className="mt-4 text-lg leading-relaxed text-[var(--text-primary)]">{currentSuggestion}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={nextSuggestion}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2.5 text-sm font-medium text-[var(--bg-color)]"
            >
              <RefreshCcw className="h-4 w-4" /> Regenerate
            </button>
            <button
              type="button"
              onClick={copySuggestion}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--card-bg)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]"
            >
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
