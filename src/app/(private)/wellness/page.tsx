'use client'

import { Check, Dumbbell, Gamepad2 } from 'lucide-react'
import { useState } from 'react'
import { wellnessBoards } from '@/data/wellness-boards'
import WellnessBoard from '@/components/wellness/WellnessBoard'
import RelationshipQuests from '@/features/games/RelationshipQuests'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'
import { supabase } from '@/lib/supabase'
import { logWellnessActivity } from '@/services/wellness'

type TabId = 'physical' | 'mental' | 'relationship' | 'quests' | 'games'

const tabs = [
  { id: 'physical' as TabId, label: 'Health', labelMy: 'ရုပ်ပိုင်းဆိုင်ရာ ကျန်းမာရေး' },
  { id: 'mental' as TabId, label: 'Mental Wellness', labelMy: 'စိတ်ပိုင်းဆိုင်ရာ ကျန်းမာရေး' },
  { id: 'relationship' as TabId, label: 'Relationship', labelMy: 'ဆက်ဆံရေး' },
  { id: 'quests' as TabId, label: 'Quests', labelMy: 'စိန်ခေါ်မှုများ' },
  { id: 'games' as TabId, label: 'Games', labelMy: 'ဂိမ်းများ' },
]

const workouts = [
  { name: 'Morning Stretch', duration: 10, calories: 50 },
  { name: 'Yoga Flow', duration: 30, calories: 150 },
  { name: 'HIIT', duration: 20, calories: 250 },
  { name: 'Couple Workout', duration: 25, calories: 200 },
  { name: 'Evening Walk', duration: 30, calories: 120 },
]
type Workout = (typeof workouts)[number]
type CompletedWorkout = Workout & { completedAt: string }

export default function WellnessPage() {
  const [activeTab, setActiveTab] = useState<TabId>('physical')
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [completedGame, setCompletedGame] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredBoards = wellnessBoards.filter(board => board.category === activeTab)

  const completeWorkout = async (workout: Workout) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      await logWellnessActivity(user.id, workout.name)
      setActionError(null)
      setCompletedWorkouts([
        ...completedWorkouts,
        { ...workout, completedAt: new Date().toISOString() },
      ])
      setSelectedWorkout(null)
    } catch (caught) {
      console.error('[wellness] log failed:', caught)
      setActionError(caught instanceof Error ? caught.message : 'Failed to save activity')
    }
  }

  const completeQuest = async (questId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      await logWellnessActivity(user.id, questId, 'quest')
      setActionError(null)
    } catch (caught) {
      console.error('[wellness] log failed:', caught)
      setActionError(caught instanceof Error ? caught.message : 'Failed to save activity')
    }
  }

  const completeGame = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      await logWellnessActivity(user.id, 'relationship-games', 'game')
      setActionError(null)
      setCompletedGame(true)
    } catch (caught) {
      console.error('[wellness] log failed:', caught)
      setActionError(caught instanceof Error ? caught.message : 'Failed to save activity')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 animate-fade-in">
      <header>
        <h1
          className="text-4xl text-text-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Wellness Boards
        </h1>
        <p className="mt-2 text-sm text-text-2">
          21 curated boards for emotional wellness
        </p>
      </header>

      {actionError ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Wellness categories">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? 'border-accent-1 bg-accent-1 text-white'
                : 'border-accent-1/20 bg-card text-text-2 hover:bg-accent-1/10'
            }`}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'quests' ? (
        <section className="rounded-panel border border-accent-1/20 bg-card p-5"><RelationshipQuests onQuestComplete={completeQuest} /></section>
      ) : activeTab === 'games' ? (
        <section className="rounded-panel border border-accent-1/20 bg-card p-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-6 w-6 text-accent-1" />
            <h2 className="text-2xl font-bold text-text-1">Games</h2>
          </div>
          <p className="mt-2 text-text-2">Playful ways to reconnect are coming together here.</p>
          <button
            type="button"
            onClick={() => void completeGame()}
            disabled={completedGame}
            className="mt-4 rounded-xl bg-accent-1 px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {completedGame ? 'Game completed' : 'Complete a game'}
          </button>
        </section>
      ) : activeTab === 'physical' ? (
        <div className="space-y-6">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-text-1">
            <Dumbbell className="h-6 w-6 text-accent-1" />
            <span>Health & movement</span>
          </h2>

          {/* Workout Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            {workouts.map((workout, i) => (
              <button
                key={i}
                onClick={() => setSelectedWorkout(workout)}
                className="border border-accent-1/20 rounded-xl p-4 text-left bg-card hover:bg-accent-1/10 transition"
              >
                <h3 className="font-bold text-lg text-text-1">{workout.name}</h3>
                <p className="text-text-2 text-sm">
                  {workout.duration} min -  {workout.calories} cal
                </p>
              </button>
            ))}
          </div>

          {/* Selected Workout */}
          {selectedWorkout && (
            <div className="border border-accent-1/20 rounded-xl p-6 bg-card">
              <h2 className="font-bold text-xl mb-4 text-text-1">{selectedWorkout.name}</h2>
              <p className="text-text-2 mb-4">
                Duration: {selectedWorkout.duration} min -  Calories: {selectedWorkout.calories}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => completeWorkout(selectedWorkout)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-1 py-3 font-bold text-white"
                >
                  <Check className="h-4 w-4" />
                  <span>Complete Workout</span>
                </button>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="px-6 py-3 border border-accent-1/20 rounded-xl text-text-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Completed Workouts */}
          {completedWorkouts.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-4 text-text-1">Completed Today</h2>
              <div className="space-y-2">
                {completedWorkouts.map((workout, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-accent-1/10 rounded-xl">
                    <span className="text-text-1">{workout.name}</span>
                    <span className="text-text-2 text-sm">
                      {workout.duration} min -  {workout.calories} cal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBoards.map((board) => (
            <WellnessBoard key={board.id} board={board} />
          ))}
        </section>
      )}
      <ExplicitAdviceControl
        title="Ask for a gentle reset"
        description="Get one small, practical step for reconnecting. Nothing is sent automatically."
        placeholder="What feels difficult for us today?"
      />
    </div>
  )
}
