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
    <section className="rounded-panel border border-accent-1/20 bg-card p-5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent-1" />
        <div>
          <h2 className="font-semibold text-text-1">{title}</h2>
          <p className="mt-1 text-sm text-text-2">{description}</p>
        </div>
      </div>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={2000}
        placeholder={placeholder}
        className="mt-4 min-h-24 w-full rounded-btn border border-accent-1/20 bg-card p-3 text-sm text-text-1 outline-none placeholder:text-text-2 focus:border-accent-1"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-text-2">Nothing is shared until you press Ask.</span>
        <button
          type="button"
          onClick={() => void ask()}
          disabled={!message.trim() || loading}
          className="rounded-full bg-accent-1 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Thinking…' : mode === 'intimacy' ? 'Ask intimacy guide' : 'Ask mediator'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      {result && (
        <div className="mt-4 rounded-btn border border-accent-1/15 bg-card p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-1">{result.response}</p>
          {result.riskLevel && (
            <p className="mt-3 text-xs text-text-2">
              Guidance level: {result.riskLevel}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
