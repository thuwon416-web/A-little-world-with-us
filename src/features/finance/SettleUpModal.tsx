'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { createSettlement } from '@/services/finance-splitwise'

type SettleUpModalProps = {
  amount: number
  fromUser: string
  toUser: string
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

const formatMmk = (value: number) => `${value.toLocaleString()} MMK`

export default function SettleUpModal({
  amount,
  fromUser,
  toUser,
  onClose,
  onSuccess,
}: SettleUpModalProps) {
  const [settlementAmount, setSettlementAmount] = useState(String(Math.round(amount)))
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSettlementAmount(String(Math.round(amount)))
  }, [amount])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedAmount = Number(settlementAmount)

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a settlement amount greater than zero.')
      return
    }

    if (parsedAmount > amount) {
      setError(`The amount cannot exceed ${formatMmk(amount)}.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createSettlement({
        fromUser,
        toUser,
        amount: parsedAmount,
        notes: notes.trim() || null,
      })
      await onSuccess()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create settlement.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="settle-up-title">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Settle up</p>
            <h2 id="settle-up-title" className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Record a payment</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settle up dialog" className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--card-bg-strong)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 rounded-2xl bg-[var(--card-bg-strong)] p-4 text-sm text-[var(--text-secondary)]">
          Current balance: <strong className="text-[var(--text-primary)]">{formatMmk(amount)}</strong>
        </p>

        <label className="mt-5 block text-sm font-medium text-[var(--text-primary)]">
          Amount
          <input
            type="number"
            min="1"
            max={amount}
            step="0.01"
            value={settlementAmount}
            onChange={(event) => setSettlementAmount(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-[var(--text-primary)]"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-[var(--text-primary)]">
          Note <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-4 py-3 text-[var(--text-primary)]"
          />
        </label>

        {error && <p className="mt-3 text-sm text-rose-300" role="alert">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--accent-1)]/20 px-4 py-3 text-sm text-[var(--text-primary)]">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-xl bg-[var(--accent-1)] px-4 py-3 text-sm font-semibold text-[var(--bg-color)] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  )
}
