'use client'

import { ArrowDownLeft, ArrowUpRight, RefreshCw, Scale } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId } from '@/lib/supabase'
import { useFinanceBalance } from '@/hooks/useFinanceBalance'
import SettleUpModal from './SettleUpModal'

const formatMmk = (value: number) => `${Math.abs(value).toLocaleString()} MMK`

export default function BalanceSummary() {
  const { balance, loading, error, refresh } = useFinanceBalance()
  const [userId, setUserId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    void Promise.all([getCurrentUserId(), getCoupleStatus()]).then(([currentUserId, status]) => {
      setUserId(currentUserId)
      setPartnerId(status.partner?.id ?? null)
    })
  }, [])

  const netBalance = balance?.netBalance ?? 0
  const canSettle = netBalance < 0 && Boolean(userId && partnerId)
  const message = loading
    ? 'Calculating your shared balance…'
    : error
      ? error
      : netBalance > 0
        ? `Your partner owes you ${formatMmk(netBalance)}`
        : netBalance < 0
          ? `You owe your partner ${formatMmk(netBalance)}`
          : 'You and your partner are all settled up'

  return (
    <>
      <section className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Splitwise balance</p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
              <Scale className="h-6 w-6 text-[var(--accent-1)]" />
              Shared balance
            </h2>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4">
            <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><ArrowUpRight className="h-4 w-4 text-rose-300" />You owe</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{formatMmk(balance?.youOweThem ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><ArrowDownLeft className="h-4 w-4 text-emerald-300" />You are owed</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{formatMmk(balance?.theyOweYou ?? 0)}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--text-secondary)]" role={error ? 'alert' : undefined}>{message}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-xs text-[var(--text-secondary)]">
            {balance?.expensesCount ?? 0} expenses · {balance?.settlementsCount ?? 0} settlements
          </p>
          <button type="button" onClick={() => setModalOpen(true)} disabled={!canSettle || loading} className="rounded-xl bg-[var(--accent-1)] px-4 py-3 text-sm font-semibold text-[var(--bg-color)] disabled:cursor-not-allowed disabled:opacity-50">
            Settle Up
          </button>
        </div>
      </section>

      {modalOpen && userId && partnerId && balance && (
        <SettleUpModal
          amount={balance.youOweThem}
          fromUser={userId}
          toUser={partnerId}
          onClose={() => setModalOpen(false)}
          onSuccess={refresh}
        />
      )}
    </>
  )
}
