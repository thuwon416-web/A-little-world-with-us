import { Gift } from 'lucide-react'
import TimeCapsule from '@/features/memories/TimeCapsule'

export default function TimeCapsulesContent() {
  return <div className="mx-auto max-w-5xl px-4 py-2">
    <section className="mb-6 rounded-panel border border-accent-1/20 bg-card p-6"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-text-2"><Gift size={12} /> Future keepsakes</div><h2 className="mt-2 text-3xl font-semibold text-text-1" style={{ fontFamily: 'var(--font-display)' }}>Time capsules</h2><p className="mt-2 text-sm text-text-2">Schedule a letter that only your partner can open when the moment arrives.</p></section>
    <TimeCapsule />
  </div>
}
