'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { X } from 'lucide-react'

import { createExpense, type SplitType } from '@/services/finance-splitwise'
import { EXPENSE_CATEGORIES, SPLIT_TYPES } from './finance-constants'

type AddExpenseModalProps = {
  currentUserId: string
  partnerId: string | null
  onClose: () => void
  onSaved: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export default function AddExpenseModal({ currentUserId, partnerId, onClose, onSaved }: AddExpenseModalProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('other')
  const [spentAt, setSpentAt] = useState(today)
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [partnerPercentage, setPartnerPercentage] = useState('50')
  const [partnerExact, setPartnerExact] = useState('0')
  const [yourShare, setYourShare] = useState('0')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = Number(amount)
  const parsedPartnerPercentage = Number(partnerPercentage)
  const parsedPartnerExact = Number(partnerExact)
  const parsedYourShare = Number(yourShare)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return setError('Title is required.')
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError('Amount must be greater than zero.')
    if (!partnerId) return setError('An accepted partner is required to add a shared expense.')
    if (splitType === 'percentage' && (!Number.isFinite(parsedPartnerPercentage) || parsedPartnerPercentage < 0 || parsedPartnerPercentage > 100)) {
      return setError("Partner's percentage must be between 0 and 100.")
    }
    if (splitType === 'custom' && (!Number.isFinite(parsedYourShare) || !Number.isFinite(parsedPartnerExact) || Math.abs(parsedYourShare + parsedPartnerExact - parsedAmount) > 0.01)) {
      return setError('Your share and partner share must add up to the total amount.')
    }

    setSubmitting(true)
    setError(null)
    try {
      await createExpense({
        title: title.trim(),
        amount: parsedAmount,
        category,
        spentAt,
        paidBy,
        splitType,
        splitWith: partnerId,
        splitPercentage: splitType === 'percentage' ? parsedPartnerPercentage : null,
        notes: notes.trim() || null,
      })
      onSaved()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save expense.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Shared finance</p>
            <h2 id="add-expense-title" className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Add expense</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close add expense dialog" className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--card-bg-strong)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-[var(--text-primary)]">Title
          <input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3" />
        </label>
        <label className="mt-4 block text-sm font-medium text-[var(--text-primary)]">Amount (MMK)
          <input required type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3" />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-3">
              {EXPENSE_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-[var(--text-primary)]">Date
            <input type="date" value={spentAt} onChange={(event) => setSpentAt(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-3" />
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-[var(--text-primary)]">Paid by</legend>
          <div className="mt-2 flex gap-4 text-sm text-[var(--text-secondary)]">
            <label><input type="radio" checked={paidBy === currentUserId} onChange={() => setPaidBy(currentUserId)} /> <span className="ml-1">You</span></label>
            <label><input type="radio" checked={paidBy === partnerId} onChange={() => partnerId && setPaidBy(partnerId)} /> <span className="ml-1">Partner</span></label>
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-[var(--text-primary)]">Split type</legend>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            {SPLIT_TYPES.map((item) => (
              <label key={item.value}><input type="radio" checked={splitType === item.value} onChange={() => setSplitType(item.value)} /> <span className="ml-1">{item.label}</span></label>
            ))}
          </div>
        </fieldset>

        {splitType === 'percentage' && (
          <label className="mt-4 block text-sm font-medium text-[var(--text-primary)]">Partner percentage
            <input type="number" min="0" max="100" step="0.01" value={partnerPercentage} onChange={(event) => setPartnerPercentage(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3" />
            <span className="mt-1 block text-xs text-[var(--text-secondary)]">Your percentage: {100 - parsedPartnerPercentage}%</span>
          </label>
        )}

        {splitType === 'custom' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">Your share
              <input type="number" min="0" step="0.01" value={yourShare} onChange={(event) => setYourShare(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3" />
            </label>
            <label className="text-sm font-medium text-[var(--text-primary)]">Partner share
              <input type="number" min="0" step="0.01" value={partnerExact} onChange={(event) => setPartnerExact(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3" />
            </label>
          </div>
        )}

        <label className="mt-4 block text-sm font-medium text-[var(--text-primary)]">Notes <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
          <textarea maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3" />
        </label>

        {error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--accent-1)]/20 px-4 py-3 text-sm text-[var(--text-primary)]">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-[var(--accent-1)] px-4 py-3 text-sm font-semibold text-[var(--bg-color)] disabled:opacity-60">{submitting ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
