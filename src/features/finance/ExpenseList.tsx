'use client'

import {
  Circle,
  Film,
  HeartPulse,
  Plane,
  Receipt,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'

import type { Expense } from '@/services/finance-splitwise'
import { EXPENSE_CATEGORIES, SPLIT_TYPES } from './finance-constants'

type ExpenseListProps = {
  expenses: Expense[]
  currentUserId: string
  partnerId: string | null
  onDelete: (id: string) => void | Promise<void>
}

const ICONS = {
  UtensilsCrossed,
  Plane,
  Receipt,
  Film,
  ShoppingBag,
  HeartPulse,
  Circle,
} as const

const formatMmk = (amount: number) => `${amount.toLocaleString()} MMK`

export default function ExpenseList({ expenses, currentUserId, partnerId, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 text-sm text-[var(--text-secondary)]">
        No expenses yet. Add your first one.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const category = EXPENSE_CATEGORIES.find((item) => item.value === expense.category) ?? EXPENSE_CATEGORIES.at(-1)!
        const Icon = ICONS[category.icon]
        const paidBy = expense.paidBy === currentUserId ? 'Paid by You' : expense.paidBy === partnerId ? 'Paid by Partner' : 'Paid by Unknown'
        const splitLabel = SPLIT_TYPES.find((item) => item.value === expense.splitType)?.label ?? expense.splitType
        return (
          <article key={expense.id} className="group flex items-center gap-4 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-1)]/10 text-[var(--accent-1)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold text-[var(--text-primary)]">{expense.title}</h3>
                {expense.isSettled && <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-xs text-emerald-300">Settled</span>}
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{paidBy} · {expense.spentAt} · {splitLabel}</p>
            </div>
            <p className="shrink-0 text-right font-semibold text-[var(--text-primary)]">{formatMmk(expense.amount)}</p>
            <button
              type="button"
              onClick={() => void onDelete(expense.id)}
              aria-label={`Delete ${expense.title}`}
              className="shrink-0 rounded-lg p-2 text-[var(--text-secondary)] opacity-0 transition-opacity hover:bg-rose-300/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        )
      })}
    </div>
  )
}
