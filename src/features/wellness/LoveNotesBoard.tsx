'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart, PencilLine, Plus, Sparkles } from 'lucide-react'

type Note = {
  id: string
  title: string
  text: string
  mood: 'sweet' | 'deep' | 'playful' | 'thankful'
}

const starterNotes: Note[] = [
  {
    id: 'm1',
    title: 'For today',
    text: 'You make ordinary moments feel like magic.',
    mood: 'sweet',
  },
  {
    id: 'm2',
    title: 'Why I adore you',
    text: 'Your kindness softly changes the room for the better.',
    mood: 'deep',
  },
]

const moodColors: Record<Note['mood'], string> = {
  sweet: 'bg-[var(--accent-1)]/20 text-[var(--accent-1)]',
  deep: 'bg-[var(--bg-2)] text-[var(--text-secondary)]',
  playful: 'bg-[var(--bg-2)] text-[var(--accent-1)]',
  thankful: 'bg-[var(--accent-2)]/20 text-[var(--text-secondary)]',
}

export default function LoveNotesBoard() {
  const [notes, setNotes] = useState<Note[]>(starterNotes)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [mood, setMood] = useState<Note['mood']>('sweet')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('love-notes-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setNotes(parsed)
        }
      }
    } catch {
      // ignore gracefully
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('love-notes-board', JSON.stringify(notes))
  }, [notes])

  const latest = useMemo(() => notes[notes.length - 1], [notes])

  const addNote = () => {
    const trimmedTitle = title.trim() || 'Untitled note'
    const trimmedText = text.trim()
    if (!trimmedText) return

    setNotes((current) => [
      ...current,
      {
        id: `note-${Date.now()}`,
        title: trimmedTitle,
        text: trimmedText,
        mood,
      },
    ])
    setTitle('')
    setText('')
    setMood('sweet')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[var(--accent-2)]">
        <Heart className="h-5 w-5" />
        <h3 className="font-dancing text-2xl">Love Notes Board</h3>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <PencilLine className="h-3.5 w-3.5" />
          Latest note
        </div>
        {latest ? (
          <div className="rounded-2xl bg-[var(--card-bg)] p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-medium text-[var(--text-primary)]">{latest.title}</span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.15em] ${moodColors[latest.mood]}`}
              >
                {latest.mood}
              </span>
            </div>
            <p className="text-sm text-[var(--text-primary)]/80">{latest.text}</p>
          </div>
        ) : (
          <p className="text-sm opacity-60">No notes yet.</p>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/15 p-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a note for your favorite person..."
          rows={3}
          className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-primary)]/40"
        />
        <div className="flex gap-2">
          <select
            value={mood}
            onChange={(event) => setMood(event.target.value as Note['mood'])}
            className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] px-2 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="sweet">Sweet</option>
            <option value="deep">Deep</option>
            <option value="playful">Playful</option>
            <option value="thankful">Thankful</option>
          </select>
          <button
            onClick={addNote}
            className="glass-button px-3 py-2 text-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/30 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-1 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />A tiny reminder
        </div>
        <p>Write the kind of note you would want to read again in five years.</p>
      </div>
    </div>
  )
}
