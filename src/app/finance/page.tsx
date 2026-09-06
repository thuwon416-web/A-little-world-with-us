'use client'
import { useState, useEffect } from 'react'
import { getCurrentUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

export default function FinancialGoals() {
  const [goals, setGoals] = useState<any[]>([])
  const [newGoal, setNewGoal] = useState({ title: '', target: '', current: '' })
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
    }
    loadUserId()
  }, [])

  useEffect(() => {
    if (userId) {
      loadGoals()
    }
  }, [userId])

  const loadGoals = async () => {
    if (!userId) return

    const { data } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setGoals(data || [])
  }

  const addGoal = async () => {
    if (!userId) return

    await supabase.from('financial_goals').insert({
      user_id: userId,
      title: newGoal.title,
      target_amount: parseFloat(newGoal.target),
      current_amount: parseFloat(newGoal.current),
    })

    setNewGoal({ title: '', target: '', current: '' })
    loadGoals()
  }

  const updateProgress = async (id: string, amount: number) => {
    await supabase.from('financial_goals').update({
      current_amount: amount,
    }).eq('id', id)

    loadGoals()
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Goals</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">💰 Financial Goals</h1>
      </section>

      {/* Add Goal */}
      <div className="grid md:grid-cols-4 gap-4">
        <input
          value={newGoal.title}
          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          placeholder="Goal name (e.g., Vacation)"
          className="px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
        <input
          type="number"
          value={newGoal.target}
          onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
          placeholder="Target ($)"
          className="px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
        <input
          type="number"
          value={newGoal.current}
          onChange={(e) => setNewGoal({ ...newGoal, current: e.target.value })}
          placeholder="Current ($)"
          className="px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        />
        <button
          onClick={addGoal}
          className="bg-[var(--accent-1)] text-[var(--bg-color)] px-4 py-2 rounded-xl font-medium"
        >
          + Add Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xl text-[var(--text-primary)]">{goal.title}</h3>
              <span className="text-[var(--text-secondary)]">
                ${goal.current_amount} / ${goal.target_amount}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[var(--accent-1)]/10 rounded-full h-4 mb-4">
              <div
                className="bg-[var(--accent-1)] h-4 rounded-full transition-all"
                style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
              />
            </div>

            {/* Update Progress */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Add amount"
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onChange={(e) => {
                  const newAmount = goal.current_amount + parseFloat(e.target.value)
                  updateProgress(goal.id, newAmount)
                  e.target.value = ''
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
