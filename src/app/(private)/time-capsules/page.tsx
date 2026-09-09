import Link from 'next/link'
import { ChevronRight, Gift, Home } from 'lucide-react'
import TimeCapsule from '@/features/memories/TimeCapsule'

export default function TimeCapsulesPage() {
  return <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
    <div className="mb-4 flex items-center gap-2 text-xs text-[var(--text-secondary)]"><Link href="/dashboard" className="flex items-center gap-1 hover:text-[var(--text-primary)]"><Home size={11} /> Home</Link><ChevronRight size={11} /><span className="text-[var(--text-primary)]">Time Capsules</span></div>
    <section className="mb-6 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)]"><Gift size={12} /> Future keepsakes</div><h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Time capsules</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Schedule a letter that only your partner can open when the moment arrives.</p></section>
    <TimeCapsule />
  </main>
}
