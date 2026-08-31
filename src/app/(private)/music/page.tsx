import Link from 'next/link'
import { ChevronRight, Headphones, Home, Play, Sparkles } from 'lucide-react'

const tracks = [
  { title: 'Sunlit Walk', artist: 'Ari & Miku', duration: '3:42' },
  { title: 'Evening Candlelight', artist: 'Soft Strings', duration: '4:18' },
  { title: 'Our Favorite Song', artist: 'Live Mix', duration: '2:57' },
]

export default function MusicPage() {
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
          A few songs for slow mornings, late-night talks, and little pockets of joy.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Now playing</div>
            <div className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Sunlit Walk</div>
          </div>
          <div className="rounded-full bg-[var(--bg-3)] p-3 text-[var(--accent-1)]">
            <Play className="h-4 w-4 fill-current" />
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-2)]">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]" />
        </div>
      </section>

      <section className="mt-6 space-y-3">
        {tracks.map((track, index) => (
          <div key={track.title} className="flex items-center justify-between rounded-2xl border border-[var(--accent-1)]/15 bg-[var(--card-bg)] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-3)] text-[var(--accent-1)]">
                {index + 1}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{track.title}</div>
                <div className="text-xs text-[var(--text-secondary)]">{track.artist}</div>
              </div>
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{track.duration}</div>
          </div>
        ))}
      </section>

      <div className="mt-6 flex items-center gap-2 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--bg-3)] p-4 text-sm text-[var(--text-primary)]">
        <Sparkles className="h-4 w-4 text-[var(--accent-1)]" />
        Curated for slow dances and warm evenings.
      </div>
    </main>
  )
}
