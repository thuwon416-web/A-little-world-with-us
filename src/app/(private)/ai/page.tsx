'use client'

import { useEffect, useState } from 'react'
import { Copy, Heart, Send, Sparkles } from 'lucide-react'

type Tool = 'chat' | 'letter' | 'message' | 'date' | 'gift' | 'surprise'

const tools: Array<{ id: Tool; label: string; description: string }> = [
  { id: 'chat', label: 'Love coach', description: 'Ask for caring, practical relationship advice.' },
  { id: 'letter', label: 'Love letter', description: 'Turn a memory into a personal letter.' },
  { id: 'message', label: 'Message helper', description: 'Draft a sweet, supportive, or repair message.' },
  { id: 'date', label: 'Date planner', description: 'Plan a date around your budget and mood.' },
  { id: 'gift', label: 'Gift ideas', description: 'Find thoughtful gifts for an occasion.' },
  { id: 'surprise', label: 'Surprise ideas', description: 'Plan a thoughtful surprise from details you choose to share.' },
]

const prompts: Record<Tool, { label: string; placeholder: string; instruction: string }> = {
  chat: { label: 'What would you like to talk through?', placeholder: 'For example: We have both been busy lately. How can we reconnect this weekend?', instruction: 'Give warm, practical relationship advice. Be concise, non-judgmental, and suggest small realistic next steps.' },
  letter: { label: 'Share names, memories, and the tone you want', placeholder: 'Write a gentle anniversary letter for May. Mention our first rainy-day coffee date and how patient she is.', instruction: 'Write a heartfelt, specific love letter. Use a warm, sincere tone and return only the letter.' },
  message: { label: 'What message do you need?', placeholder: 'A short apology after I forgot our call. I want it to feel honest, not dramatic.', instruction: 'Draft three short message options. Match the requested tone, avoid manipulative language, and label each option.' },
  date: { label: 'Tell us the budget, location, and interests', placeholder: 'Budget 50,000 MMK, Yangon, quiet food and photo walks, 3 hours on Saturday.', instruction: 'Create three practical romantic date plans. Include estimated cost in MMK, time, and a simple first step for each.' },
  gift: { label: 'Tell us the occasion and what they enjoy', placeholder: 'Birthday gift under 60,000 MMK. They love journaling, tea, and handmade things.', instruction: 'Suggest five thoughtful, realistic gift ideas. Include why each fits and a rough budget in MMK.' },
  surprise: { label: 'Share the occasion, interests, and a budget', placeholder: 'Birthday, loves coffee walks and handmade notes, budget 50,000 MMK. They dislike crowded places.', instruction: 'Create five private surprise ideas using only these details. Include a simple first step and approximate cost in MMK.' },
}

export default function AIFeaturePage() {
  const [tool, setTool] = useState<Tool>('chat')
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [provider, setProvider] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')

  const current = prompts[tool]

  useEffect(() => {
    const saved = localStorage.getItem('ai-last-result')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as { tool?: Tool; input?: string; result?: string; provider?: string }
      if (parsed.tool && parsed.result) {
        setTool(parsed.tool)
        setInput(parsed.input ?? '')
        setResult(parsed.result)
        setProvider(parsed.provider ?? '')
      }
    } catch {
      localStorage.removeItem('ai-last-result')
    }
  }, [])

  const generate = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setError('')

    try {
      const response = await fetch(tool === 'surprise' ? '/api/ai/surprise' : '/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: tool === 'surprise'
          ? JSON.stringify({ occasion: 'A private surprise', interests: input.trim() })
          : JSON.stringify({ message: `${current.instruction}\n\nUser request: ${input.trim()}` }),
      })
      const data = await response.json() as { response?: string; ideas?: string; provider?: string; error?: string }
      const generated = tool === 'surprise' ? data.ideas : data.response
      if (!response.ok || !generated) throw new Error(data.error || 'Unable to generate a response')
      setResult(generated)
      setProvider(data.provider || '')
      localStorage.setItem('ai-last-result', JSON.stringify({ tool, input: input.trim(), result: generated, provider: data.provider || '', savedAt: new Date().toISOString() }))
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to generate a response')
    } finally {
      setLoading(false)
    }
  }

  const copyResult = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
    window.setTimeout(() => setCopyStatus(''), 2000)
  }

  const clearResult = () => {
    setResult('')
    setProvider('')
    localStorage.removeItem('ai-last-result')
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">AI companion</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Love assistant</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">Private prompts for the moments when a little help finding the right words is welcome.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--accent-1)]"><Sparkles className="h-4 w-4" /> AI assisted</div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-2 rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
          {tools.map((item) => (
            <button key={item.id} type="button" onClick={() => { setTool(item.id); setInput(''); setResult(''); setError('') }} className={`w-full rounded-2xl p-4 text-left transition ${tool === item.id ? 'bg-[var(--accent-1)]/15 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--card-bg-strong)]'}`}>
              <span className="block font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs leading-relaxed opacity-75">{item.description}</span>
            </button>
          ))}
        </aside>

        <section className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 sm:p-7">
          <div className="flex items-center gap-2 text-[var(--accent-1)]"><Heart className="h-5 w-5" /><h2 className="text-xl font-semibold text-[var(--text-primary)]">{tools.find((item) => item.id === tool)?.label}</h2></div>
          <label className="mt-6 block text-sm font-medium text-[var(--text-primary)]" htmlFor="ai-request">{current.label}</label>
          <textarea id="ai-request" value={input} onChange={(event) => setInput(event.target.value)} placeholder={current.placeholder} maxLength={1000} className="mt-3 min-h-36 w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-1)]" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[var(--text-secondary)]">{input.length}/1000</span><button type="button" disabled={!input.trim() || loading} onClick={() => void generate()} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-5 py-2.5 text-sm font-semibold text-[var(--bg-color)] disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{loading ? 'Thinking…' : 'Generate'}</button></div>
          {error ? <p className="mt-5 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p> : null}
          {result ? <div className="mt-6 rounded-3xl border border-[var(--accent-1)]/15 bg-[var(--card-bg-strong)] p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Your result{provider ? ` · ${provider}` : ''}</p><div className="flex items-center gap-2"><button type="button" onClick={() => void copyResult()} className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/20 px-3 py-1.5 text-xs text-[var(--text-primary)]"><Copy className="h-3.5 w-3.5" />{copyStatus || 'Copy'}</button><button type="button" onClick={clearResult} className="rounded-full border border-red-400/30 px-3 py-1.5 text-xs text-red-300">Clear</button></div></div><p className="mt-4 whitespace-pre-wrap leading-7 text-[var(--text-primary)]">{result}</p></div> : null}
        </section>
      </div>
    </div>
  )
}
