'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

type MemoryOption = { id: string; title: string; date: string }

export default function MemoryCurationAI({ memories = [] }: { memories?: MemoryOption[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [theme, setTheme] = useState('Our story')
  const [context, setContext] = useState('')
  const [story, setStory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const generate = async () => {
    if (!selected.length) { setError('Choose at least one memory first.'); return }
    setLoading(true); setError('')
    const response = await fetch('/api/ai/curate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memoryIds: selected, theme, context }) })
    const body = await response.json() as { story?: string; error?: string }
    if (!response.ok || !body.story) setError(body.error ?? 'Unable to create a story right now.')
    else setStory(body.story)
    setLoading(false)
  }
  return <section className="glass-card space-y-4 p-5"><div className="flex items-center gap-2 text-[var(--accent-2)]"><Wand2 className="h-5 w-5" /><h2 className="font-serif text-2xl">Memory curation</h2></div><p className="text-sm text-[var(--text-secondary)]">Only the memories you select below are sent to the AI.</p><div className="max-h-48 space-y-2 overflow-y-auto">{memories.map((memory) => <label key={memory.id} className="flex items-center gap-2 rounded-xl bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"><input type="checkbox" checked={selected.includes(memory.id)} onChange={() => setSelected((current) => current.includes(memory.id) ? current.filter((id) => id !== memory.id) : [...current, memory.id])} />{memory.title} <span className="text-xs text-[var(--text-secondary)]">{memory.date}</span></label>)}</div><input value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Theme" className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-[var(--text-primary)]" /><textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Optional context (only what you choose to share)" className="min-h-20 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-[var(--text-primary)]" /><button type="button" onClick={generate} disabled={loading || !memories.length} className="rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50">{loading ? 'Creating...' : 'Create story'}</button>{error && <p className="text-sm text-red-400">{error}</p>}{story && <article className="rounded-2xl bg-[var(--bg-2)] p-4 text-sm leading-7 text-[var(--text-primary)] whitespace-pre-wrap">{story}</article>}</section>
}
