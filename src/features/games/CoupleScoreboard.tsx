'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Heart, Sparkles } from 'lucide-react'

const initialStats = [
  { label: 'Arguments won', me: 8, her: 6 },
  { label: 'Who says sorry', me: 12, her: 9 },
  { label: 'Snacks stolen', me: 5, her: 7 },
]

const badges = ['First Fight Survivor', 'Best Apology', 'Snack Bandit', 'Teamwork MVP']

export default function CoupleScoreboard() {
  const [stats, setStats] = useState(initialStats)

  const winner = useMemo(() => {
    const meTotal = stats.reduce((sum, item) => sum + item.me, 0)
    const herTotal = stats.reduce((sum, item) => sum + item.her, 0)

    if (meTotal === herTotal) return 'It’s a draw, love!'
    return meTotal > herTotal ? 'You win this round 😌' : 'She wins this round 💖'
  }, [stats])

  const awardPoint = (index: number, side: 'me' | 'her') => {
    setStats((prev) =>
      prev.map((stat, i) =>
        i === index
          ? {
              ...stat,
              [side]: stat[side] + 1,
            }
          : stat
      )
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--accent-2)]">
          <Award className="w-5 h-5" />
          <h3 className="font-dancing text-2xl">Couple Scoreboard</h3>
        </div>
        <span className="text-xs opacity-70">{winner}</span>
      </div>

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={stat.label} className="glass-card p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{stat.label}</span>
              <div className="flex gap-2 text-xs opacity-70">
                <button onClick={() => awardPoint(index, 'me')} className="glass-button px-2 py-1">
                  +1 You
                </button>
                <button onClick={() => awardPoint(index, 'her')} className="glass-button px-2 py-1">
                  +1 Her
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[var(--card-bg-strong)] p-2">
                <span className="opacity-60">You</span>
                <div className="font-semibold text-[var(--text-primary)]">{stat.me}</div>
              </div>
              <div className="rounded-xl bg-[var(--bg-2)] p-2">
                <span className="opacity-60">Her</span>
                <div className="font-semibold text-[var(--text-primary)]">{stat.her}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-3 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 text-[var(--accent-1)]">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Achievement Badges</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <motion.span
              key={badge}
              whileHover={{ y: -2, scale: 1.03 }}
              className="rounded-full bg-gradient-to-r from-[var(--accent-1)]/25 to-[var(--accent-2)]/25 px-3 py-2 text-[11px] font-medium"
            >
              {badge}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}
