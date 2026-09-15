'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  calculateBalance,
  getExpenses,
  getSettlements,
  type BalanceSummary,
} from '@/services/finance-splitwise'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId } from '@/lib/supabase'

type FinanceBalanceState = {
  balance: BalanceSummary | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const initialState: BalanceSummary = {
  netBalance: 0,
  theyOweYou: 0,
  youOweThem: 0,
  totalExpenses: 0,
  expensesCount: 0,
  settlementsCount: 0,
}

export function useFinanceBalance(): FinanceBalanceState {
  const [balance, setBalance] = useState<BalanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [userId, coupleStatus] = await Promise.all([getCurrentUserId(), getCoupleStatus()])
      const partnerId = coupleStatus.partner?.id

      if (!userId || coupleStatus.status !== 'accepted' || !partnerId) {
        setBalance(initialState)
        setError('An accepted couple link is required to calculate a balance.')
        return
      }

      const [expenses, settlements] = await Promise.all([getExpenses(), getSettlements()])
      setBalance(calculateBalance(expenses, settlements, userId, partnerId))
    } catch (caught) {
      setBalance(null)
      setError(caught instanceof Error ? caught.message : 'Unable to load finance balance.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { balance, loading, error, refresh }
}
