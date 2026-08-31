import Link from 'next/link'
import { ChevronRight, Heart, Home, Sparkles } from 'lucide-react'

const stats = [
  { label: 'Shared memories', value: '124', tone: 'text-[var(--accent-1)]' },
  { label: 'Date nights', value: '18', tone: 'text-[var(--accent-2)]' },
  { label: 'Inbox notes', value: '42', tone: 'text-[var(--accent-3)]' },
]

export default function StatsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl py-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-[var(--text-primary)]">
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} />
        <span className="text-[var(--text-primary)]">Stats</span>
      </div>

      <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">Our rhythm</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Relationship Stats
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Little glimpses of all the moments that keep us growing closer.
        </p>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className={`text-3xl font-bold ${stat.tone}`} style={{ fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </div>
            <div className="mt-2 text-sm text-[var(--text-secondary)]">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--accent-1)]">
          <Sparkles size={12} /> This month
        </div>
        <div className="mt-4 space-y-4">
          {[
            { label: 'Quality time', value: '8 sessions', bar: 'w-[74%]' },
            { label: 'Kind moments', value: '21 notes', bar: 'w-[86%]' },
            { label: 'Shared laughter', value: '96%', bar: 'w-[96%]' },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{item.label}</span>
                <span className="font-medium text-[var(--text-primary)]">{item.value}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--bg-2)]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)] ${item.bar}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex items-center gap-2 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--bg-3)] p-4 text-sm text-[var(--text-primary)]">
        <Heart className="h-4 w-4 text-[var(--accent-1)]" />
        The happiest metric is still how easy it feels to be close to you.
      </div>
    </main>
  )
}
