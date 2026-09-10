'use client'

import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronRight, Headphones, Home, Play, Sparkles } from 'lucide-react'
import { moodBoard } from '@/features/music/music-data'
import type { MusicTrack } from '@/features/music/music-types'

const SharedPlaylist = dynamic(() => import('@/features/music/SharedPlaylist'), { ssr: false })
const YouTubePlayer = dynamic(() => import('@/features/music/YouTubePlayer'), { ssr: false })

type MusicTab = 'playlist' | 'moods'

export default function MusicPage() {
  const [tab, setTab] = useState<MusicTab>('playlist')
  const [preview, setPreview] = useState<MusicTrack | null>(null)

  return (
    <main className="mx-auto min-h-screen max-w-5xl py-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-[var(--text-primary)]">
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} />
        <span className="text-[var(--text-primary)]">Music</span>
      </div>

      <section className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 backdrop-blur">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          <Headphones size={12} /> Companion playlist
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Sounds for us
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Keep the songs that feel like you two close at hand.
        </p>
      </section>

      <div className="mt-6 flex rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-1" role="tablist" aria-label="Music views">
        {([['playlist', 'Our Playlist'], ['moods', 'Mood Board']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm transition ${tab === value ? 'bg-[var(--accent-1)]/15 font-medium text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'playlist' ? (
        <section className="mt-6">
          <SharedPlaylist realtime />
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--accent-1)]" /> Find the right feeling</div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">A few starting points for your next shared moment. Add the ones you love to Our Playlist.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {moodBoard.map((mood) => (
              <article key={mood.id} className={`rounded-3xl border border-[var(--accent-1)]/15 bg-gradient-to-br ${mood.accent} p-5`}>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{mood.label}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{mood.description}</p>
                <div className="mt-4 space-y-2">
                  {mood.tracks.map((track) => (
                    <button key={track.youtubeId} type="button" onClick={() => setPreview(track)} className="flex w-full items-center gap-3 rounded-2xl border border-[var(--accent-1)]/10 bg-[var(--card-bg)]/50 p-3 text-left hover:bg-[var(--card-bg)]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-1)]/10 text-[var(--accent-1)]"><Play className="h-3.5 w-3.5 fill-current" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[var(--text-primary)]">{track.title}</span><span className="block truncate text-xs text-[var(--text-secondary)]">{track.artist}</span></span>
                      <span className="text-xs text-[var(--text-secondary)]">{track.duration}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {preview && <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4"><div className="mb-3 text-sm font-medium text-[var(--text-primary)]">Preview: {preview.title}</div><YouTubePlayer videoId={preview.youtubeId} title={preview.title} /></div>}
        </section>
      )}
    </main>
  )
}
