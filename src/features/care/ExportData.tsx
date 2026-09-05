'use client'

import { supabase } from '@/lib/supabase'

export default function ExportData() {
  const handleExport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in to export data')
        return
      }

      // Fetch daily logs
      const { data: logs } = await supabase
        .from('care_daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false })

      if (!logs || logs.length === 0) {
        alert('No data to export')
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
      alert('Failed to export data')
    }
  }

  const convertToCSV = (data: any[]) => {
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
    <div className="p-4 bg-white/10 rounded-lg">
      <h3 className="font-medium mb-2">Export Data</h3>
      <p className="text-sm text-gray-400 mb-3">Download your care data as CSV</p>
      <button
        type="button"
        onClick={handleExport}
        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm transition"
      >
        📥 Download CSV
      </button>
    </div>
  )
}
