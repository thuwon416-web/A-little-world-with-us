'use client'

import { Flame } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase'

type Goal = { id: string; title: string; target_amount: number; current_amount: number }
type Bill = { id: string; title: string; amount: number; due_date: string }

export default function AdvancedFinancePanel() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [budget, setBudget] = useState('')
  const [budgetValue, setBudgetValue] = useState<number | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [streak, setStreak] = useState(0)
  const [ideas, setIdeas] = useState<string[]>([])
  const month = new Date().toISOString().slice(0, 7)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: link } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
    if (!link?.couple_id) return
    setCoupleId(link.couple_id)
    const [budgetResult, goalsResult, billsResult, streakResult] = await Promise.all([
      supabase.from('monthly_budgets').select('amount').eq('couple_id', link.couple_id).eq('month', month).maybeSingle(),
      supabase.from('financial_goals').select('id,title,target_amount,current_amount').eq('couple_id', link.couple_id).order('created_at', { ascending: false }),
      supabase.from('bill_reminders').select('id,title,amount,due_date').eq('couple_id', link.couple_id).order('due_date'),
      supabase.from('love_streaks').select('current_streak').eq('couple_id', link.couple_id).maybeSingle(),
    ])
    setBudgetValue(budgetResult.data?.amount ?? null); setGoals((goalsResult.data ?? []) as Goal[]); setBills((billsResult.data ?? []) as Bill[]); setStreak(streakResult.data?.current_streak ?? 0)
  }, [month])
  useEffect(() => { void load() }, [load])
  const saveBudget = async () => { if (!coupleId || !Number.isFinite(Number(budget)) || Number(budget) < 0) return; await supabase.from('monthly_budgets').upsert({ couple_id: coupleId, month, amount: Number(budget) }); setBudgetValue(Number(budget)); setBudget('') }
  const suggestions = useMemo(() => goals.slice(0, 3).map((goal) => `${goal.title}: ${Math.round((goal.current_amount / Math.max(1, goal.target_amount)) * 100)}% funded`), [goals])
  return <section className="space-y-4 rounded-modal border border-accent-1/20 bg-card p-5"><div><p className="text-xs uppercase tracking-[0.22em] text-text-2">Advanced tools</p><h2 className="mt-2 text-2xl font-bold text-text-1">Budget, reminders & streak</h2></div><div className="grid gap-4 md:grid-cols-3"><article className="glass-card p-4"><h3 className="text-lg font-semibold">Monthly budget</h3><p className="text-sm text-text-2">{budgetValue === null ? 'No budget set' : `${budgetValue.toLocaleString()} MMK`}</p><div className="mt-3 flex gap-2"><input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Amount" type="number" className="glass-input min-w-0 flex-1 px-3 py-2" /><button type="button" onClick={() => void saveBudget()} className="glass-button px-3 py-2 text-sm">Save</button></div></article><article className="glass-card p-4"><div className="flex items-center gap-2"><h3 className="text-lg font-semibold">Love streak</h3><Flame className="h-5 w-5 text-accent-1" /></div><p className="text-3xl font-bold text-accent-1">{streak} days</p><p className="text-sm text-text-2">Check in from the native Finance screen to grow it.</p></article><article className="glass-card p-4"><h3 className="text-lg font-semibold">Savings snapshot</h3>{suggestions.length ? suggestions.map((item) => <p key={item} className="text-sm text-text-2">{item}</p>) : <p className="text-sm text-text-2">Add a goal to see progress.</p>}</article></div><div className="grid gap-4 md:grid-cols-2"><article className="glass-card p-4"><h3 className="text-lg font-semibold">Upcoming bills</h3>{bills.length ? bills.slice(0, 5).map((bill) => <p key={bill.id} className="text-sm text-text-2">{bill.title} · {Number(bill.amount).toLocaleString()} MMK · {bill.due_date}</p>) : <p className="text-sm text-text-2">No bill reminders yet.</p>}</article><article className="glass-card p-4"><h3 className="text-lg font-semibold">Date idea prompt</h3><p className="text-sm text-text-2">Use the native Finance screen for mood, weather, and location-aware AI date ideas.</p><button type="button" onClick={() => setIdeas(['Try a sunset walk and a shared dessert.', 'Cook a new recipe together tonight.'])} className="glass-button mt-3 px-3 py-2 text-sm">Show gentle ideas</button>{ideas.map((idea) => <p key={idea} className="mt-2 text-sm text-text-2">• {idea}</p>)}</article></div></section>
}
