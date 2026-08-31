'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Msg {
  id?: string
  role: 'user' | 'assistant'
  text: string
  created_at?: string
}

export default function AIChat() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL
  const companionSince = process.env.NEXT_PUBLIC_COUPLE_START || '2023-01-01'

  // Load semantic memory (facts) and episodic memory from localStorage
  useEffect(() => {
    try {
      const sem = localStorage.getItem('ai-semantic')
      const epi = localStorage.getItem('ai-episodic')
      const initial: Msg[] = []
      if (sem) initial.push({ role: 'assistant', text: `Facts: ${sem}` })
      if (epi) initial.push({ role: 'assistant', text: `Past: ${epi}` })
      setMessages(initial)
    } catch (e) {}
  }, [])

  const send = async () => {
    if (!input.trim()) return
    const userMsg: Msg = { role: 'user', text: input }
    setMessages((m) => [...m, userMsg])
    setInput('')

    // store to working memory (local for now)
    try {
      const current = JSON.parse(localStorage.getItem('ai-working') || '[]')
      current.push({ role: 'user', text: input, created_at: new Date().toISOString() })
      localStorage.setItem('ai-working', JSON.stringify(current))
    } catch (e) {}

    if (!apiUrl) {
      // graceful fallback
      setLoading(false)
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `I am dreaming of our memories, AI coming soon! Meanwhile: we met on ${companionSince} — ask me about our favorite song.`,
        },
      ])
      return
    }

    setLoading(true)
    try {
      const payload = {
        messages: [
          ...messages.map((x) => ({ role: x.role, content: x.text })),
          { role: 'user', content: input },
        ],
        system: `You are a romantic AI companion. You know the couple since ${companionSince}. Tone: warm, playful, teasing, loving.`,
      }
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      const reply = data?.reply || data?.text || 'I am reflecting on our memories...'
      const aiMsg: Msg = { role: 'assistant', text: reply, created_at: new Date().toISOString() }
      setMessages((m) => [...m, aiMsg])

      // append to episodic memory (localStorage) for now
      try {
        const epi = JSON.parse(localStorage.getItem('ai-episodic') || '[]')
        epi.push({ role: 'user', text: input, reply, created_at: aiMsg.created_at })
        localStorage.setItem('ai-episodic', JSON.stringify(epi.slice(-200)))
      } catch (e) {}
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Sorry — I could not reach the AI service.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="max-h-48 overflow-y-auto p-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${m.role === 'assistant' ? 'bg-[var(--bg-color)]/80 text-[var(--text-primary)]' : 'bg-[var(--accent-1)]/90 text-[var(--text-primary)]'}`}
          >
            <div className="text-sm">{m.text}</div>
            <div className="text-[10px] opacity-50 mt-1">
              {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask our companion..."
          className="flex-1 p-2 rounded bg-[var(--card-bg)]/60"
        />
        <button onClick={send} className="glass-button px-3 py-1" disabled={loading}>
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
