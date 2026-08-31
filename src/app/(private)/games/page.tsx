import RelationshipQuests from '@/features/games/RelationshipQuests'

export default function GamesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-6 py-6">
      <section className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          Yours & Mine
        </p>

        <h1
          className="mt-2 text-3xl font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Quests
        </h1>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">Little rituals of love.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 backdrop-blur">
          <RelationshipQuests />
        </div>

        <div className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            Level
          </p>

          <h2
            className="mt-2 text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Level 2
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">Devoted</p>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--bg-2)]">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[var(--accent-1)] to-[var(--accent-2)]" />
          </div>

          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            68% to next level
          </p>
        </div>
      </section>
    </main>
  )
}
