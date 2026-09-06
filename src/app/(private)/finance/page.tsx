'use client'

import { useEffect, useState } from 'react'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

interface FinancialGoal {
  id: string
  title: string
  target_amount: number
  current_amount: number
}

export default function FinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [newGoal, setNewGoal] = useState({ title: '', target: '', current: '' })
  const [userId, setUserId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([getCurrentUserId(), getCoupleStatus()]).then(([id, status]) => {
      setUserId(id)
      setCoupleId(status.status === 'accepted' ? status.couple?.id ?? null : null)
    })
  }, [])

  useEffect(() => {
    if (userId && coupleId) void loadGoals()
  }, [userId, coupleId])

  const loadGoals = async () => {
    if (!coupleId) return

    const { data } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    setGoals((data ?? []) as FinancialGoal[])
  }

  const addGoal = async () => {
    const targetAmount = Number(newGoal.target)
    const currentAmount = Number(newGoal.current || 0)
    if (!userId || !coupleId || !newGoal.title.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || currentAmount < 0) return

    const { error } = await supabase.from('financial_goals').insert({
      user_id: userId,
      couple_id: coupleId,
      title: newGoal.title.trim(),
      target_amount: targetAmount,
      current_amount: currentAmount,
    })

    if (error) return
    setNewGoal({ title: '', target: '', current: '' })
    await loadGoals()
  }

  const updateProgress = async (goal: FinancialGoal, value: string) => {
    const addedAmount = Number(value)
    if (!Number.isFinite(addedAmount) || addedAmount <= 0) return

    const { error } = await supabase
      .from('financial_goals')
      .update({ current_amount: goal.current_amount + addedAmount })
      .eq('id', goal.id)

    if (!error) await loadGoals()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Goals</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">💰 Financial Goals</h1>
      </section>

      {!coupleId && <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">Link and accept a partner before creating shared financial goals.</p>}

      <section className="grid gap-4 rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5 md:grid-cols-4">
        <input value={newGoal.title} onChange={(event) => setNewGoal({ ...newGoal, title: event.target.value })} placeholder="Goal name (e.g., Vacation)" className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
        <input type="number" min="0" value={newGoal.target} onChange={(event) => setNewGoal({ ...newGoal, target: event.target.value })} placeholder="Target ($)" className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
        <input type="number" min="0" value={newGoal.current} onChange={(event) => setNewGoal({ ...newGoal, current: event.target.value })} placeholder="Current ($)" className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" />
        <button type="button" onClick={addGoal} className="rounded-xl bg-[var(--accent-1)] px-4 py-3 font-medium text-[var(--bg-color)]">+ Add Goal</button>
      </section>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100))
          return (
            <section key={goal.id} className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
              <div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-[var(--text-primary)]">{goal.title}</h2><span className="text-sm text-[var(--text-secondary)]">${goal.current_amount} / ${goal.target_amount}</span></div>
              <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-[var(--accent-1)]/10"><div className="h-full rounded-full bg-[var(--accent-1)] transition-all" style={{ width: `${progress}%` }} /></div>
              <input type="number" min="0" placeholder="Add amount" className="w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" onBlur={(event) => { void updateProgress(goal, event.target.value); event.target.value = '' }} />
            </section>
          )
        })}
      </div>
    </div>
  )
}
