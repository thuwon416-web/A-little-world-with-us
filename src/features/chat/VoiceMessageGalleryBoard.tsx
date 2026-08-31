'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Mic2, Play, Sparkles, Volume2 } from 'lucide-react'

type VoiceNote = {
  id: string
  title: string
  duration: string
  snippet: string
  accent: 'rose' | 'sky' | 'gold' | 'violet'
  active: boolean
}

const starterNotes: VoiceNote[] = [
  {
    id: 'voice-1',
    title: 'Good morning, love',
    duration: '00:24',
    snippet: 'I was thinking about your laugh and it made the whole day feel softer.',
    accent: 'rose',
    active: true,
  },
  {
    id: 'voice-2',
    title: 'For the hard hour',
    duration: '00:41',
    snippet: 'You do not have to carry all of it alone. I am here with you.',
    accent: 'sky',
    active: false,
  },
  {
    id: 'voice-3',
    title: 'Tiny reminder',
    duration: '00:19',
    snippet: 'You are still the favorite part of my day, even in the loudest moments.',
    accent: 'gold',
    active: false,
  },
]

const accentMeta = {
  rose: 'from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--card-bg)] text-[var(--accent-1)]',
  sky: 'from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--card-bg)] text-[var(--text-secondary)]',
  gold: 'from-[var(--accent-2)] via-[var(--accent-2)] to-[var(--card-bg)] text-[var(--accent-1)]',
  violet:
    'from-[var(--accent-1)] via-[var(--accent-1)] to-[var(--card-bg)] text-[var(--text-secondary)]',
} as const

export default function VoiceMessageGalleryBoard() {
  const [notes, setNotes] = useState<VoiceNote[]>(starterNotes)
  const [selectedId, setSelectedId] = useState<string>(starterNotes[0]?.id ?? '')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('voice-message-gallery-board')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setNotes(parsed)
          const firstActive = parsed.find((item: VoiceNote) => item.active)
          if (firstActive) setSelectedId(firstActive.id)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('voice-message-gallery-board', JSON.stringify(notes))
  }, [notes])

  const activeNote = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? notes[0] ?? null,
    [notes, selectedId]
  )

  if (!activeNote) {
    return null
  }

  const togglePlay = (id: string) => {
    setNotes((current) =>
      current.map((note) => ({
        ...note,
        active: note.id === id,
      }))
    )
    setSelectedId(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Mic2 className="h-5 w-5" />
          <h3 className="font-dancing text-2xl">Voice Messages</h3>
        </div>
        <div className="rounded-full border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-2 py-1 text-[10px] font-medium text-[var(--accent-1)]">
          {notes.length} saved
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)]/25 p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)]/60">
          <span>Now playing</span>
          <span>{activeNote?.duration ?? '00:00'}</span>
        </div>

        <div
          className={`rounded-2xl bg-gradient-to-br p-4 ${accentMeta[activeNote?.accent ?? 'rose']}`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-[var(--card-bg)]/60 p-2 text-current">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">Voice note</p>
                <p className="font-medium text-sm">{activeNote?.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePlay(activeNote.id)}
              className="glass-button px-3 py-2 text-[10px] uppercase tracking-[0.18em]"
            >
              {activeNote?.active ? 'Playing' : 'Play'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-2)]/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] via-[var(--accent-2)] to-[var(--accent-2)]"
                initial={{ width: 0 }}
                animate={{ width: activeNote?.active ? '68%' : '18%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">
              {activeNote?.active ? 'live' : 'ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <motion.button
            key={note.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => togglePlay(note.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
              note.id === selectedId
                ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] shadow-[0_8px_20px_rgba(244,114,182,0.12)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-1)]/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full border p-2 ${note.active ? 'border-[var(--accent-1)]/20 bg-[var(--bg-2)] text-[var(--accent-1)]' : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)]/70'}`}
              >
                {note.active ? (
                  <Play className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Mic2 className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]/90">{note.title}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-primary)]/50">
                  {note.duration}
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-primary)]/60">
              {note.active ? 'playing' : 'saved'}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-1)] p-3 text-sm text-[var(--text-primary)]/80">
        <div className="mb-2 flex items-center gap-2 font-medium text-[var(--accent-2)]">
          <Sparkles className="h-4 w-4" />
          Sweet note
        </div>
        <p>
          Every little voice note is a gentle reminder that love keeps speaking even when the room
          is quiet.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-1)]/30 bg-[var(--bg-2)] p-3 text-sm text-[var(--accent-1)]">
        <Heart className="h-4 w-4" />
        <span>Your voice is still one of the most beautiful parts of this place.</span>
      </div>
    </div>
  )
}
