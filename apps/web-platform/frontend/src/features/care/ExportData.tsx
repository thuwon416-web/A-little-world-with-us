'use client'

import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

type CsvRow = Record<string, unknown>

export default function ExportData() {
  const { t } = useLanguage()
  const handleExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert(t('Settings.loginToExport'))
        return
      }

      // Fetch daily logs
      const { data: logs } = await supabase
        .from('care_daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })

      if (!logs || logs.length === 0) {
        alert(t('Settings.noDataToExport'))
        return
      }

      // Convert to CSV
      const csv = convertToCSV(logs)

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `care-data-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      alert(t('Settings.exportDataError'))
    }
  }

  const convertToCSV = (data: CsvRow[]) => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    )

    return [headers, ...rows].join('\n')
  }

  return (
    <div className="p-4 bg-soft-tint/20 rounded-lg">
      <h3 className="font-medium mb-2">{t('Settings.exportDataTitle')}</h3>
      <p className="text-sm text-text-2 mb-3">{t('Settings.exportDataDescription')}</p>
      <button
        type="button"
        onClick={handleExport}
        className="ui-button-primary min-h-11 px-4 py-2 text-sm transition"
      >
        <Download className="mr-2 inline h-4 w-4" /> Download CSV
      </button>
    </div>
  )
}
