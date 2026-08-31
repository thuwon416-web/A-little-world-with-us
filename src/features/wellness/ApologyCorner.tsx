'use client'

import { useState } from 'react'
import { HeartHandshake, Send } from 'lucide-react'

const templates = [
  'I am sorry for the way I hurt you and for not being gentler with your feelings.',
  'I am sorry for the silence that made you feel alone. I want to do better with my words and my attention.',
  'I am sorry for making you feel unseen. I love you, and I want to repair this with patience and care.',
]

export default function ApologyCorner() {
  const [draft, setDraft] = useState(templates[0])
  const [submitted, setSubmitted] = useState(false)

  const sendApology = () => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 1400)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <HeartHandshake className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Apology Corner</h3>
      </div>

      <div className="space-y-3">
        {templates.map((template) => (
          <button
            key={template}
            type="button"
            onClick={() => setDraft(template)}
            className="block w-full rounded-2xl bg-[var(--card-bg)] p-3 text-left text-sm text-[var(--text-primary)]/80"
          >
            {template}
          </button>
        ))}
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        placeholder="Write your own apology..."
      />

      <button
        onClick={sendApology}
        className="glass-button w-full text-sm flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {submitted ? 'Sent with love' : 'Send apology'}
      </button>
    </div>
  )
}
