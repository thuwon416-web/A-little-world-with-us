'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'

const TicTacToe = dynamic(() => import('@/features/games/TicTacToe'), { loading: () => <div className="min-h-24 animate-pulse rounded-btn bg-soft-tint/40" /> })

function GameCard({ children }: { readonly children: React.ReactNode }) {
  return <div className="glass-card rounded-panel p-5">{children}</div>
}

export default function GamesPage() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-panel border border-accent-1/20 bg-card p-6">
        <div className="flex items-center gap-3 text-accent-1">
          <Gamepad2 className="h-7 w-7" />
          <h1 className="text-4xl font-semibold text-text-1" style={{ fontFamily: 'var(--font-display)' }}>Play</h1>
        </div>
        <p className="mt-2 text-sm text-text-2">A tiny game for two hearts.</p>
      </motion.header>
      <section aria-label="Playful games" className="space-y-4">
        <GameCard><TicTacToe /></GameCard>
      </section>
    </div>
  )
}
