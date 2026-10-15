'use client'

import { Flame, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoveStreakBadge from '@/components/shared/LoveStreakBadge'

type Goal = { id: string; title: string; target_amount: number; current_amount: number }
type Bill = { id: string; title: string; amount: number; due_date: string; repeat?: string }

export default function AdvancedFinancePanel() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [budget, setBudget] = useState('')
  const [budgetValue, setBudgetValue] = useState<number | null>(null)
  const [budgetError, setBudgetError] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [ideas, setIdeas] = useState<string[]>([])
  const [showAddBill, setShowAddBill] = useState(false)
  const [newBill, setNewBill] = useState({ title: '', amount: '', due_date: '', repeat: 'monthly' })
  const [billSaving, setBillSaving] = useState(false)
  const [billError, setBillError] = useState('')

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data: link } = await supabase
      .from('couple_links')
      .select('couple_id')
      .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
      .eq('status', 'accepted')
      .maybeSingle()
    if (!link?.couple_id) return
    setCoupleId(link.couple_id)

    const [budgetResult, goalsResult, billsResult] = await Promise.all([
      supabase.from('monthly_budgets').select('amount').eq('couple_id', link.couple_id).eq('month', month).maybeSingle(),
      supabase.from('financial_goals').select('id,title,target_amount,current_amount').eq('couple_id', link.couple_id).order('created_at', { ascending: false }),
      supabase.from('bill_reminders').select('id,title,amount,due_date,repeat').eq('couple_id', link.couple_id).order('due_date'),
    ])

    setBudgetValue(budgetResult.data?.amount ?? null)
    setGoals((goalsResult.data ?? []) as Goal[])
    setBills((billsResult.data ?? []) as Bill[])
  }, [month])

  useEffect(() => {
    void load()
  }, [load])

  const saveBudget = async () => {
    if (!coupleId || !userId || !Number.isFinite(Number(budget)) || Number(budget) < 0) return
    setBudgetError('')
    try {
      const { error } = await supabase
        .from('monthly_budgets')
        .upsert({ couple_id: coupleId, user_id: userId, month, amount: Number(budget) })
      if (error) {
        setBudgetError(error.message)
        return
      }
      setBudgetValue(Number(budget))
      setBudget('')
    } catch (error) {
      setBudgetError(error instanceof Error ? error.message : 'Unable to save monthly budget.')
    }
  }

  const handleCreateBill = async () => {
    const amount = Number(newBill.amount)
    if (!coupleId || !userId || !newBill.title.trim() || !Number.isFinite(amount) || amount < 0 || !newBill.due_date) {
      setBillError('Please provide a title, valid amount, and due date.')
      return
    }
    setBillSaving(true)
    setBillError('')
    try {
      const { error } = await supabase.from('bill_reminders').insert({
        couple_id: coupleId,
        user_id: userId,
        title: newBill.title.trim(),
        amount,
        due_date: newBill.due_date,
        repeat: newBill.repeat || 'monthly',
      })
      if (error) throw error
      setNewBill({ title: '', amount: '', due_date: '', repeat: 'monthly' })
      setShowAddBill(false)
      await load()
    } catch (error) {
      setBillError(error instanceof Error ? error.message : 'Unable to save bill reminder.')
    } finally {
      setBillSaving(false)
    }
  }

  const handleDeleteBill = async (id: string) => {
    if (!coupleId) return
    const { error } = await supabase.from('bill_reminders').delete().eq('id', id)
    if (!error) {
      setBills((current) => current.filter((b) => b.id !== id))
    }
  }

  const suggestions = useMemo(
    () =>
      goals.slice(0, 3).map(
        (goal) =>
          `${goal.title}: ${Math.round((goal.current_amount / Math.max(1, goal.target_amount)) * 100)}% funded`
      ),
    [goals]
  )

  return (
    <section className="space-y-4 rounded-modal border border-accent-1/20 bg-card p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">Advanced tools</p>
        <h2 className="mt-2 text-2xl font-bold text-text-1">Budget, reminders & streak</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass-card p-4">
          <h3 className="text-lg font-semibold">Monthly budget</h3>
          <p className="text-sm text-text-2">
            {budgetValue === null ? 'No budget set' : `${budgetValue.toLocaleString()} MMK`}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="Amount (MMK)"
              type="number"
              className="glass-input min-w-0 flex-1 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void saveBudget()}
              className="glass-button px-3 py-2 text-sm font-semibold"
            >
              Save
            </button>
          </div>
          {budgetError ? <p role="alert" className="mt-2 text-sm text-error">{budgetError}</p> : null}
        </article>

        <article className="glass-card flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Daily streak</h3>
              <Flame className="h-5 w-5 text-accent-1" />
            </div>
            <p className="mt-1 text-xs text-text-2">Grow your shared check-in rhythm</p>
          </div>
          <div className="mt-3">
            <LoveStreakBadge coupleId={coupleId} />
          </div>
        </article>

        <article className="glass-card p-4">
          <h3 className="text-lg font-semibold">Savings snapshot</h3>
          {suggestions.length ? (
            <div className="mt-2 space-y-1">
              {suggestions.map((item) => (
                <p key={item} className="text-sm text-text-2">
                  • {item}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-2">Add a goal below to see progress.</p>
          )}
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="glass-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Upcoming bills & subscriptions</h3>
            <button
              type="button"
              onClick={() => setShowAddBill(!showAddBill)}
              className="inline-flex items-center gap-1 rounded-lg border border-accent-1/25 bg-accent-1/10 px-2.5 py-1 text-xs font-semibold text-text-1 hover:bg-accent-1/20 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddBill ? 'Cancel' : 'Add Bill'}</span>
            </button>
          </div>

          {showAddBill && (
            <div className="mt-3 space-y-2 rounded-xl border border-accent-1/15 bg-card/60 p-3">
              <input
                type="text"
                placeholder="Bill title (e.g. Netflix, Wi-Fi, Rent)"
                value={newBill.title}
                onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                className="w-full rounded-lg border border-accent-1/20 bg-card px-3 py-1.5 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Amount (MMK)"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                  className="rounded-lg border border-accent-1/20 bg-card px-3 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={newBill.due_date}
                  onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                  className="rounded-lg border border-accent-1/20 bg-card px-3 py-1.5 text-sm"
                />
              </div>
              {billError && <p className="text-xs text-error">{billError}</p>}
              <button
                type="button"
                onClick={() => void handleCreateBill()}
                disabled={billSaving}
                className="w-full rounded-lg bg-accent-1 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95"
              >
                {billSaving ? 'Saving…' : 'Save Bill Reminder'}
              </button>
            </div>
          )}

          <div className="mt-3 space-y-2">
            {bills.length ? (
              bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 p-2.5 text-sm"
                >
                  <div>
                    <p className="font-semibold text-text-1">{bill.title}</p>
                    <p className="text-xs text-text-2">
                      Due: {bill.due_date} · {bill.repeat || 'monthly'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-accent-1">
                      {Number(bill.amount).toLocaleString()} MMK
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteBill(bill.id)}
                      title="Delete bill reminder"
                      className="text-text-2 transition hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-text-2">No bill reminders yet. Click Add Bill to start.</p>
            )}
          </div>
        </article>

        <article className="glass-card p-4">
          <h3 className="text-lg font-semibold">Date idea prompt</h3>
          <p className="mt-1 text-sm text-text-2">
            Gentle ideas to make ordinary moments feel like special dates together.
          </p>
          <button
            type="button"
            onClick={() =>
              setIdeas([
                'Try a sunset walk and a shared dessert.',
                'Cook a new recipe together tonight without phones.',
                'Write 3 things you love about each other on sticky notes.',
              ])
            }
            className="glass-button mt-3 px-3 py-2 text-sm font-semibold"
          >
            Show gentle ideas
          </button>
          <div className="mt-3 space-y-1.5">
            {ideas.map((idea) => (
              <p key={idea} className="text-sm text-text-2">
                • {idea}
              </p>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
