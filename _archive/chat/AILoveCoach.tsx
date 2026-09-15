'use client'

import { useState } from 'react'
import { BrainCircuit, Sparkles } from 'lucide-react'

export default function AILoveCoach() {
  const [request, setRequest] = useState('')
  const [guidance, setGuidance] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ask = async () => {
    if (!request.trim()) { setError('Write what you would like help with.'); return }
    setLoading(true); setError('')
    const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: request.trim() }) })
    const body = await response.json() as { response?: string; error?: string }
    if (!response.ok || !body.response) setError(body.error ?? 'AI guidance is unavailable right now.')
    else setGuidance(body.response)
    setLoading(false)
  }
  return <section className="glass-card space-y-4 p-5"><div className="flex items-center gap-2 text-[var(--accent-1)]"><BrainCircuit className="h-5 w-5" /><h2 className="font-serif text-2xl">Love coach</h2></div><p className="text-sm text-[var(--text-secondary)]">Your typed request is used for this reply. It does not automatically read your chat, Care, or private memories.</p><textarea value={request} onChange={(event) => setRequest(event.target.value)} maxLength={1000} placeholder="For example: Help us plan a calm reconnecting evening after a stressful week." className="min-h-28 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-[var(--text-primary)]" /><button type="button" onClick={ask} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50"><Sparkles className="h-4 w-4" />{loading ? 'Thinking...' : 'Get guidance'}</button>{error && <p className="text-sm text-red-400">{error}</p>}{guidance && <article className="whitespace-pre-wrap rounded-2xl bg-[var(--bg-2)] p-4 text-sm leading-7 text-[var(--text-primary)]">{guidance}</article>}<p className="text-xs text-[var(--text-secondary)]">This is gentle relationship guidance, not medical, legal, or crisis advice.</p></section>
}
