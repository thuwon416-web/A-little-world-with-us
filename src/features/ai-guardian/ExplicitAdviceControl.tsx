'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { AdviceResult } from './AIGuardianProvider'
import { useAIGuardian } from './useAIGuardian'

type AdviceMode = 'mediator' | 'intimacy'

export default function ExplicitAdviceControl({
  mode = 'mediator',
  title,
  description,
  placeholder,
}: {
  mode?: AdviceMode
  title: string
  description: string
  placeholder: string
}) {
  const { askMediator, askIntimacy } = useAIGuardian()
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<AdviceResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!message.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const next = mode === 'intimacy'
        ? await askIntimacy({ message: message.trim() })
        : await askMediator({ message: message.trim() })
      setResult(next)
    } catch (caughtError) {
      setResult(null)
      setError(caughtError instanceof Error ? caughtError.message : 'AI advice is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-1)]" />
        <div>
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={2000}
        placeholder={placeholder}
        className="mt-4 min-h-24 w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-1)]"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[var(--text-secondary)]">Nothing is shared until you press Ask.</span>
        <button
          type="button"
          onClick={() => void ask()}
          disabled={!message.trim() || loading}
          className="rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-semibold text-[var(--bg-color)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Thinking…' : mode === 'intimacy' ? 'Ask intimacy guide' : 'Ask mediator'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      {result && (
        <div className="mt-4 rounded-2xl border border-[var(--accent-1)]/15 bg-[var(--card-bg-strong)] p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">{result.response}</p>
          {result.riskLevel && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              Guidance level: {result.riskLevel}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
