'use client'

import { useState } from 'react'
import { wellnessBoards } from '@/data/wellness-boards'
import WellnessBoard from '@/components/wellness/WellnessBoard'

type TabId = 'physical' | 'mental' | 'relationship' | 'workout'

const tabs = [
  { id: 'physical' as TabId, label: 'Physical Health', labelMy: 'ရုပ်ပိုင်းဆိုင်ရာ ကျန်းမာရေး' },
  { id: 'mental' as TabId, label: 'Mental Wellness', labelMy: 'စိတ်ပိုင်းဆိုင်ရာ ကျန်းမာရေး' },
  { id: 'relationship' as TabId, label: 'Relationship', labelMy: 'ဆက်ဆံရေး' },
  { id: 'workout' as TabId, label: 'Workout Together', labelMy: 'တူတွဲ လေ့ကစား' },
]

const workouts = [
  { name: 'Morning Stretch', duration: 10, calories: 50 },
  { name: 'Yoga Flow', duration: 30, calories: 150 },
  { name: 'HIIT', duration: 20, calories: 250 },
  { name: 'Couple Workout', duration: 25, calories: 200 },
  { name: 'Evening Walk', duration: 30, calories: 120 },
]

export default function WellnessPage() {
  const [activeTab, setActiveTab] = useState<TabId>('physical')
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)

  const filteredBoards = wellnessBoards.filter(board => board.category === activeTab)

  const completeWorkout = (workout: any) => {
    setCompletedWorkouts([
      ...completedWorkouts,
      { ...workout, completedAt: new Date().toISOString() },
    ])
    setSelectedWorkout(null)
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 animate-fade-in">
      <header>
        <h1
          className="text-4xl text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Wellness Boards
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          20 curated boards for emotional wellness
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Wellness categories">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? 'border-[var(--accent-1)]/40 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10'
            }`}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'workout' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">💪 Workout Together</h2>

          {/* Workout Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            {workouts.map((workout, i) => (
              <button
                key={i}
                onClick={() => setSelectedWorkout(workout)}
                className="border border-[var(--accent-1)]/20 rounded-xl p-4 text-left bg-[var(--card-bg)] hover:bg-[var(--accent-1)]/10 transition"
              >
                <h3 className="font-bold text-lg text-[var(--text-primary)]">{workout.name}</h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {workout.duration} min -  {workout.calories} cal
                </p>
              </button>
            ))}
          </div>

          {/* Selected Workout */}
          {selectedWorkout && (
            <div className="border border-[var(--accent-1)]/20 rounded-xl p-6 bg-[var(--card-bg)]">
              <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">{selectedWorkout.name}</h2>
              <p className="text-[var(--text-secondary)] mb-4">
                Duration: {selectedWorkout.duration} min -  Calories: {selectedWorkout.calories}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => completeWorkout(selectedWorkout)}
                  className="flex-1 bg-[var(--accent-1)] text-[var(--bg-color)] py-3 rounded-xl font-bold"
                >
                  ✓ Complete Workout
                </button>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="px-6 py-3 border border-[var(--accent-1)]/20 rounded-xl text-[var(--text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Completed Workouts */}
          {completedWorkouts.length > 0 && (
            <div>
              <h2 className="font-bold text-xl mb-4 text-[var(--text-primary)]">Completed Today</h2>
              <div className="space-y-2">
                {completedWorkouts.map((workout, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-[var(--accent-1)]/10 rounded-xl">
                    <span className="text-[var(--text-primary)]">{workout.name}</span>
                    <span className="text-[var(--text-secondary)] text-sm">
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
    </main>
  )
}
