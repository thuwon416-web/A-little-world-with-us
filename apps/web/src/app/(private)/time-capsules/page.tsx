import { Gift } from 'lucide-react'
import TimeCapsule from '@/features/memories/TimeCapsule'

export default function TimeCapsulesContent() {
  return (
    <div className="w-full space-y-4">
      <section className="rounded-modal border border-accent-1/15 bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-2">
          <Gift size={15} /> Future keepsakes
        </div>
        <h3 className="mt-2 font-serif text-xl text-text-1 sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
          Time capsules
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-2">
          Schedule a letter that only your partner can open when the moment arrives.
        </p>
      </section>
      <TimeCapsule />
    </div>
  )
}
