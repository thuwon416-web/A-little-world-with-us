'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'

type ExportedMessage = { created_at: string }

export default function ChatHistoryExport() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all')

  const handleExport = async () => {
    setLoading(true)

    const { couple } = await getCoupleStatus()
    if (!couple) return

    // Load messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: true })

    // Filter by date range
    const now = new Date()
    const filtered = ((messages || []) as ExportedMessage[]).filter((msg) => {
      if (dateRange === 'all') return true
      if (dateRange === '7d') {
        return new Date(msg.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
      if (dateRange === '30d') {
        return new Date(msg.created_at) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      return true
    })

    // Export as JSON
    const json = JSON.stringify(filtered, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `chat-history-${now.toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-accent-1" />
        Export Chat History
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-sm text-text-2">Date Range</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDateRange('7d')}
              className={`flex-1 rounded-input px-3 py-2 text-sm ${
                dateRange === '7d'
                  ? 'bg-accent-1 text-white'
                  : 'bg-soft-tint text-text-2'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`flex-1 rounded-input px-3 py-2 text-sm ${
                dateRange === '30d'
                  ? 'bg-accent-1 text-white'
                  : 'bg-soft-tint text-text-2'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`flex-1 rounded-input px-3 py-2 text-sm ${
                dateRange === 'all'
                  ? 'bg-accent-1 text-white'
                  : 'bg-soft-tint text-text-2'
              }`}
            >
              All time
            </button>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-input bg-accent-1 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {loading ? 'Exporting...' : 'Export as JSON'}
        </button>
      </div>
    </div>
  )
}
