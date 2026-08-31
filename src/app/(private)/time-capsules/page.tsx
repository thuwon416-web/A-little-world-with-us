import Link from 'next/link'
import { CalendarClock, ChevronRight, Gift, Home } from 'lucide-react'

const capsules = [
  { title: 'Our first anniversary', date: '2026-09-15', note: 'A tiny note for the version of us we are about to become.' },
  { title: 'New home', date: '2027-04-01', note: 'A snapshot of the life we are building, room by room.' },
  { title: 'Future us', date: '2030-12-31', note: 'A letter we will open when life is a little slower and a little wiser.' },
]

export default function TimeCapsulesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl py-6">
      <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-[var(--text-primary)]">
          <Home size={11} /> Home
        </Link>
        <ChevronRight size={11} />
        <span className="text-[var(--text-primary)]">Time Capsules</span>
      </div>

      <section className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 backdrop-blur">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          <Gift size={12} /> Future keepsakes
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Time capsules
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Little moments we can open again when life has changed shape.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        {capsules.map((capsule) => (
          <div key={capsule.title} className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Planned reveal</div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{capsule.title}</h2>
              </div>
              <div className="rounded-full bg-[var(--bg-3)] p-2 text-[var(--accent-1)]">
                <CalendarClock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-sm text-[var(--accent-1)]">{capsule.date}</div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{capsule.note}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
