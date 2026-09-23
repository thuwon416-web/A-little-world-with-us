'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Sparkles, Trophy } from 'lucide-react'

const gameLoading = () => <div className="min-h-24 animate-pulse rounded-btn bg-soft-tint/40" />
const LoveCalculatorMigrated = dynamic(() => import('@/features/games/LoveCalculatorMigrated'), { loading: gameLoading })
const LoveQuiz = dynamic(() => import('@/features/games/LoveQuiz'), { loading: gameLoading })
const DailyQuestionGame = dynamic(() => import('@/features/games/DailyQuestionGame'), { loading: gameLoading })
const TicTacToe = dynamic(() => import('@/features/games/TicTacToe'), { loading: gameLoading })
const ScavengerHunt = dynamic(() => import('@/features/games/ScavengerHunt'), { loading: gameLoading })
const LoveWeather = dynamic(() => import('@/features/games/LoveWeather'), { loading: gameLoading })
const FuturePredictions = dynamic(() => import('@/features/games/FuturePredictions'), { loading: gameLoading })
const RelationshipQuests = dynamic(() => import('@/features/games/RelationshipQuests'), { loading: gameLoading })

function GameCard({ children }: { children: React.ReactNode }) {
  return <div className="glass-card rounded-panel p-5">{children}</div>
}

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'playful' | 'trackers'>('quizzes')
  const tabs = [
    { id: 'quizzes' as const, label: 'Quizzes', Icon: Sparkles },
    { id: 'playful' as const, label: 'Interactive play', Icon: Gamepad2 },
    { id: 'trackers' as const, label: 'Trackers & insights', Icon: Trophy },
  ]
  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-8">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-panel border border-accent-1/20 bg-card p-6">
        <div className="flex items-center gap-3 text-accent-1">
          <Gamepad2 className="h-7 w-7" />
          <h1 className="text-4xl font-semibold text-text-1" style={{ fontFamily: 'var(--font-display)' }}>Couple Games</h1>
        </div>
        <p className="mt-2 text-sm text-text-2">Little games for two hearts.</p>
      </motion.header>

      <div role="tablist" aria-label="Game categories" className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`games-panel-${id}`} onClick={() => setActiveTab(id)} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === id ? 'bg-accent-1 text-white' : 'bg-card text-text-2 hover:bg-soft-tint'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'quizzes' ? <motion.section id="games-panel-quizzes" role="tabpanel" aria-label="Quizzes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-text-1"><Sparkles className="h-5 w-5 text-accent-1" /> Quizzes</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <GameCard><LoveQuiz /></GameCard>
          <GameCard><DailyQuestionGame /></GameCard>
        </div>
      </motion.section> : null}

      {activeTab === 'playful' ? <motion.section id="games-panel-playful" role="tabpanel" aria-label="Playful games" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-text-1"><Gamepad2 className="h-5 w-5 text-accent-1" /> Playful</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <GameCard><LoveCalculatorMigrated /></GameCard>
          <GameCard><TicTacToe /></GameCard>
          <GameCard><ScavengerHunt /></GameCard>
          <GameCard><LoveWeather /></GameCard>
        </div>
      </motion.section> : null}

      {activeTab === 'trackers' ? <motion.section id="games-panel-trackers" role="tabpanel" aria-label="Trackers and insights" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-text-1"><Trophy className="h-5 w-5 text-accent-1" /> Trackers &amp; insights</h2>
        <div className="grid gap-6 lg:grid-cols-2"><GameCard><FuturePredictions /></GameCard><GameCard><RelationshipQuests /></GameCard></div>
      </motion.section> : null}
    </div>
  )
}
