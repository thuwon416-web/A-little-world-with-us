'use client'

import { useEffect, useState } from 'react'
import { MessageCircleHeart, Plus } from 'lucide-react'

type JokeEntry = {
  term: string
  meaning: string
}

const starterJokes: JokeEntry[] = [
  {
    term: 'Tiny disaster',
    meaning:
      'The adorable little chaos that happens whenever one of us forgets something important but still looks cute.',
  },
  {
    term: 'Love warp',
    meaning:
      'The weird, irrational way you can make a normal day feel magical just by being there.',
  },
  {
    term: 'Us mode',
    meaning:
      'When absolutely nothing else matters except being in the same room and enjoying each other.',
  },
]

export default function InsideJokeDictionary() {
  const [entries, setEntries] = useState(starterJokes)
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('a-little-world-with-us-jokes')
    if (stored) setEntries(JSON.parse(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('a-little-world-with-us-jokes', JSON.stringify(entries))
  }, [entries])

  const addEntry = () => {
    if (!term.trim() || !meaning.trim()) return
    setEntries((prev) => [{ term: term.trim(), meaning: meaning.trim() }, ...prev])
    setTerm('')
    setMeaning('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <MessageCircleHeart className="w-5 h-5" />
        <h3 className="font-dancing text-2xl">Inside Joke Dictionary</h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.term} className="rounded-2xl bg-[var(--card-bg)] p-3">
            <div className="font-medium text-[var(--text-primary)]">{entry.term}</div>
            <div className="mt-1 text-sm opacity-75">{entry.meaning}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="New term"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <textarea
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          rows={2}
          placeholder="What does it mean?"
          className="w-full rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3 text-sm outline-none"
        />
        <button
          onClick={addEntry}
          className="glass-button w-full text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add phrase
        </button>
      </div>
    </div>
  )
}
