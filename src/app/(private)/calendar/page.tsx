import LoveCalendar from '@/features/planning/LoveCalendar'
import BucketList from '@/features/planning/BucketList'
import SharedWishlist from '@/features/planning/SharedWishlist'

export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1
          className="text-4xl text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Calendar & Planning
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Our events, goals, and dreams</p>
      </header>

      <section className="space-y-6">
        <div className="glass-card p-5">
          <LoveCalendar />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <BucketList />
          </div>

          <div className="glass-card p-5">
            <SharedWishlist />
          </div>
        </div>
      </section>
    </main>
  )
}
