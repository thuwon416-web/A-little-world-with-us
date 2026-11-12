'use client'

import { useState } from 'react'
import { getCoupleStatus } from '@/lib/couples'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export default function FinanceExport() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const exportFinance = async () => {
    setLoading(true)
    try {
      const { couple } = await getCoupleStatus()
      if (!couple) throw new Error(t('Settings.financeLinkRequired'))
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
      alert(error instanceof Error ? error.message : t('Settings.financeExportError'))
    } finally {
      setLoading(false)
    }
  }

  return <button type="button" onClick={() => void exportFinance()} disabled={loading} className="ui-button-primary min-h-11 px-4 py-2 text-sm transition disabled:opacity-50">{loading ? t('Settings.exporting') : t('Settings.exportFinance')}</button>
}
