'use client'

import { DollarSign } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'
import AdvancedFinancePanel from '@/features/finance/AdvancedFinancePanel'
import BalanceSummary from '@/features/finance/BalanceSummary'
import AddExpenseModal from '@/features/finance/AddExpenseModal'
import CategoryFilter from '@/features/finance/CategoryFilter'
import ExpenseList from '@/features/finance/ExpenseList'
import { deleteExpense, getExpenses, type Expense } from '@/services/finance-splitwise'

interface FinancialGoal {
  id: string
  title: string
  target_amount: number
  current_amount: number
}

const formatMmk = (amount: number) => `${amount.toLocaleString()} MMK`

export default function FinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [newGoal, setNewGoal] = useState({ title: '', target: '', current: '' })
  const [userId, setUserId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseFilter, setExpenseFilter] = useState('all')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [expensesError, setExpensesError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([getCurrentUserId(), getCoupleStatus()]).then(([id, status]) => {
      setUserId(id)
      setCoupleId(status.status === 'accepted' ? status.couple?.id ?? null : null)
      setPartnerId(status.status === 'accepted' ? status.partner?.id ?? null : null)
    })
  }, [])

  const loadExpenses = useCallback(async () => {
    setLoadingExpenses(true)
    setExpensesError(null)
    try {
      setExpenses(await getExpenses())
    } catch (caught) {
      setExpenses([])
      setExpensesError(caught instanceof Error ? caught.message : 'Unable to load expenses.')
    } finally {
      setLoadingExpenses(false)
    }
  }, [])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  const loadGoals = useCallback(async () => {
    if (!coupleId) return

    const { data } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })

    setGoals((data ?? []) as FinancialGoal[])
  }, [coupleId])

  useEffect(() => {
    if (userId && coupleId) void loadGoals()
  }, [userId, coupleId, loadGoals])

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
      <section className="rounded-[32px] border border-accent-1/20 bg-card p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">Goals</p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-serif text-text-1">
          <DollarSign className="h-7 w-7 text-accent-1" />
          <span>Financial Goals</span>
        </h1>
      </section>

      <ExplicitAdviceControl
        title="Talk through a money decision"
        description="Ask for a neutral conversation starter. AI never sees your finance records unless you type them here."
        placeholder="How can we discuss a shared goal or budget difference respectfully?"
      />
      <BalanceSummary />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-serif text-text-1">Shared Expenses</h2>
          <button
            type="button"
            onClick={() => setShowAddExpense(true)}
            disabled={!userId || !partnerId}
            className="glass-button inline-flex items-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Expense
          </button>
        </div>
        <CategoryFilter active={expenseFilter} onChange={setExpenseFilter} />
        {loadingExpenses ? (
          <div className="rounded-btn border border-accent-1/20 bg-card p-6 text-sm text-text-2">
            Loading expenses…
          </div>
        ) : expensesError ? (
          <div className="rounded-btn border border-error/30 bg-error/10 p-6 text-sm text-text-2">
            <p className="text-error">Unable to load expenses</p>
            <p className="mt-1">{expensesError}</p>
            <button type="button" onClick={() => void loadExpenses()} className="glass-button mt-4 px-4 py-2 text-sm font-semibold">Retry</button>
          </div>
        ) : (
          <ExpenseList
            expenses={expenses.filter((expense) => expenseFilter === 'all' || expense.category === expenseFilter)}
            currentUserId={userId ?? ''}
            partnerId={partnerId}
            onDelete={async (id) => {
              await deleteExpense(id)
              setExpenses((previous) => previous.filter((expense) => expense.id !== id))
            }}
          />
        )}
      </section>
      <AdvancedFinancePanel />

      {!coupleId && <p className="rounded-btn border border-warning/30 bg-warning/10 p-4 text-sm text-warning">Link and accept a partner before creating shared financial goals.</p>}

      <section className="grid gap-4 rounded-modal border border-accent-1/20 bg-card p-5 sm:grid-cols-2 md:grid-cols-4">
        <input value={newGoal.title} onChange={(event) => setNewGoal({ ...newGoal, title: event.target.value })} placeholder="Goal name (e.g., Vacation)" className="rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-text-1 placeholder:text-text-2" />
        <input type="number" min="0" value={newGoal.target} onChange={(event) => setNewGoal({ ...newGoal, target: event.target.value })} placeholder="Target (MMK)" className="rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-text-1 placeholder:text-text-2" />
        <input type="number" min="0" value={newGoal.current} onChange={(event) => setNewGoal({ ...newGoal, current: event.target.value })} placeholder="Current (MMK)" className="rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-text-1 placeholder:text-text-2" />
        <button type="button" onClick={addGoal} className="rounded-xl bg-accent-1 px-4 py-3 font-medium text-white">+ Add Goal</button>
      </section>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100))
          return (
            <section key={goal.id} className="rounded-[24px] border border-accent-1/20 bg-card p-5">
              <div className="mb-3 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-text-1">{goal.title}</h2><span className="text-sm text-text-2">{formatMmk(goal.current_amount)} / {formatMmk(goal.target_amount)}</span></div>
              <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-accent-1/10"><div className="h-full rounded-full bg-accent-1 transition-all" style={{ width: `${progress}%` }} /></div>
              <input type="number" min="0" placeholder="Add amount" className="w-full rounded-xl border border-accent-1/20 bg-card px-4 py-3 text-text-1 placeholder:text-text-2" onBlur={(event) => { void updateProgress(goal, event.target.value); event.target.value = '' }} />
            </section>
          )
        })}
      </div>

      {showAddExpense && userId && (
        <AddExpenseModal
          currentUserId={userId}
          partnerId={partnerId}
          onClose={() => setShowAddExpense(false)}
          onSaved={() => {
            void loadExpenses()
          }}
        />
      )}
    </div>
  )
}
