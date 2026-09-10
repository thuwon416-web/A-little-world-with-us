'use client'

import { useState } from 'react'
import { getCoupleStatus } from '@/lib/couples'
import { supabase } from '@/lib/supabase'

export default function FinanceExport() {
  const [loading, setLoading] = useState(false)

  const exportFinance = async () => {
    setLoading(true)
    try {
      const { couple } = await getCoupleStatus()
      if (!couple) throw new Error('Link with your partner before exporting finance data.')
      const { data, error } = await supabase.from('financial_goals').select('*').eq('couple_id', couple.id)
      if (error) throw error
      const blob = new Blob([JSON.stringify(data ?? [], null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `finance-data-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to export finance data.')
    } finally {
      setLoading(false)
    }
  }

  return <button type="button" onClick={() => void exportFinance()} disabled={loading} className="rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm text-[var(--text-primary)] disabled:opacity-50">{loading ? 'Exporting...' : 'Export Finance Data'}</button>
}
