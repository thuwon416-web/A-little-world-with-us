'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Gamepad2, Sparkles, Trophy } from 'lucide-react'

const gameLoading = () => <div className="min-h-24 animate-pulse rounded-2xl bg-[var(--bg-2)]/40" />
const LoveCalculatorMigrated = dynamic(() => import('@/features/games/LoveCalculatorMigrated'), { loading: gameLoading })
const LoveQuiz = dynamic(() => import('@/features/games/LoveQuiz'), { loading: gameLoading })
const DailyQuestionGame = dynamic(() => import('@/features/games/DailyQuestionGame'), { loading: gameLoading })
const TicTacToe = dynamic(() => import('@/features/games/TicTacToe'), { loading: gameLoading })
const ScavengerHunt = dynamic(() => import('@/features/games/ScavengerHunt'), { loading: gameLoading })
const LoveWeather = dynamic(() => import('@/features/games/LoveWeather'), { loading: gameLoading })
const CoupleScoreboard = dynamic(() => import('@/features/games/CoupleScoreboard'), { loading: gameLoading })
const FuturePredictions = dynamic(() => import('@/features/games/FuturePredictions'), { loading: gameLoading })
const GiftRecommender = dynamic(() => import('@/features/games/GiftRecommender'), { loading: gameLoading })
const RelationshipQuests = dynamic(() => import('@/features/games/RelationshipQuests'), { loading: gameLoading })

function GameCard({ children }: { children: React.ReactNode }) {
  return <div className="glass-card rounded-3xl p-5">{children}</div>
}

function QuizPlaceholderCard({
  title,
  subtitle,
  badge,
}: {
  title: string
  subtitle: string
  badge?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtitle}</p>
        </div>
        {badge ? (
          <span className="rounded-full bg-[var(--accent-1)]/10 px-2 py-1 text-[10px] text-[var(--accent-1)]">
            {badge}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => window.alert(`${title} is coming soon!`)}
        className="mt-4 w-full rounded-full bg-[var(--accent-1)]/15 py-2 text-xs font-semibold text-[var(--accent-1)] transition hover:bg-[var(--accent-1)]/25"
      >
        Coming soon
      </button>
    </motion.div>
  )
}

export default function GamesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-10 px-4 py-8">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-3 text-[var(--accent-1)]">
          <Gamepad2 className="h-7 w-7" />
          <h1 className="text-4xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Couple Games</h1>
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Little games for two hearts.</p>
      </motion.header>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]"><Sparkles className="h-5 w-5 text-[var(--accent-1)]" /> Quizzes</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <GameCard><LoveQuiz /></GameCard>
          <GameCard><DailyQuestionGame /></GameCard>
          <QuizPlaceholderCard title="Couple Quiz" subtitle="Shared questions for two" />
          <QuizPlaceholderCard title="Would You Rather" subtitle="20 questions" badge="20 questions" />
          <QuizPlaceholderCard title="Never Have I Ever" subtitle="30 questions" badge="30 questions" />
          <QuizPlaceholderCard title="36 Questions" subtitle="36 questions" badge="36 questions" />
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]"><Gamepad2 className="h-5 w-5 text-[var(--accent-1)]" /> Playful</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <GameCard><LoveCalculatorMigrated /></GameCard>
          <GameCard><TicTacToe /></GameCard>
          <GameCard><ScavengerHunt /></GameCard>
          <GameCard><LoveWeather /></GameCard>
          <GameCard><CoupleScoreboard /></GameCard>
          <GameCard><FuturePredictions /></GameCard>
          <GameCard><GiftRecommender /></GameCard>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]"><Trophy className="h-5 w-5 text-[var(--accent-1)]" /> Quests</h2>
        <GameCard><RelationshipQuests /></GameCard>
      </motion.section>
    </main>
  )
}
