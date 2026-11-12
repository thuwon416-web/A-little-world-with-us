'use client'

import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronRight, Headphones, Home, Play, Sparkles } from 'lucide-react'
import { moodBoard } from '@/features/music/music-data'
import { useLanguage } from '@/contexts/LanguageContext'
import type { MusicTrack } from '@/features/music/music-types'

const SharedPlaylist = dynamic(() => import('@/features/music/SharedPlaylist'), { ssr: false })
const YouTubePlayer = dynamic(() => import('@/features/music/YouTubePlayer'), { ssr: false })

type MusicTab = 'playlist' | 'moods'

export default function MusicPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState<MusicTab>('playlist')
  const [preview, setPreview] = useState<MusicTrack | null>(null)

  return (
    <div className="mx-auto min-h-screen max-w-5xl py-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-text-2">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-text-1">
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} />
        <span className="text-text-1">{t('Music.music')}</span>
      </div>

      <section className="rounded-panel border border-accent-1/20 bg-card p-6 backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-2">
          <Headphones size={12} /> Companion playlist
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-text-1" style={{ fontFamily: 'var(--font-display)' }}>
          Sounds for us
        </h1>
        <p className="mt-2 text-sm text-text-2">
          {t('Music.description')}
        </p>
      </section>

      <div className="mt-6 flex rounded-btn border border-accent-1/20 bg-card p-1" role="tablist" aria-label={t('Music.musicViews')}>
        {([['playlist', t('Music.ourPlaylist')], ['moods', t('Music.moodBoard')]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`min-h-11 flex-1 rounded-xl px-4 py-2 text-sm transition ${tab === value ? 'bg-accent-1/15 font-medium text-text-1' : 'text-text-2 hover:text-text-1'}`}
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
          <div className="rounded-panel border border-accent-1/20 bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-text-1"><Sparkles className="h-4 w-4 text-accent-1" /> {t('Music.findFeeling')}</div>
            <p className="mt-1 text-sm text-text-2">{t('Music.moodDescription')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {moodBoard.map((mood) => (
              <article key={mood.id} className={`rounded-panel border border-accent-1/15 bg-gradient-to-br ${mood.accent} p-5`}>
                <h2 className="text-lg font-semibold text-text-1">{t(`Music.moods.${mood.id}`)}</h2>
                <p className="mt-1 text-sm text-text-2">{t(`Music.moods.${mood.id}Description`)}</p>
                <div className="mt-4 space-y-2">
                  {mood.tracks.map((track) => (
                    <button key={track.youtubeId} type="button" onClick={() => setPreview(track)} className="flex min-h-11 w-full items-center gap-3 rounded-btn border border-accent-1/10 bg-card/50 p-3 text-left hover:bg-card">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-1/10 text-accent-1"><Play className="h-3.5 w-3.5 fill-current" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-text-1">{track.title}</span><span className="block truncate text-xs text-text-2">{track.artist}</span></span>
                      <span className="text-xs text-text-2">{track.duration}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {preview && <div className="rounded-panel border border-accent-1/20 bg-card p-4"><div className="mb-3 text-sm font-medium text-text-1">{t('Music.preview')}: {preview.title}</div><YouTubePlayer videoId={preview.youtubeId} title={preview.title} /></div>}
        </section>
      )}
    </div>
  )
}
