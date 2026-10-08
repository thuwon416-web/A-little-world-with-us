'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'

type ExportedMessage = { created_at: string }

export default function ChatHistoryExport() {
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all')
  const [archiveMonth, setArchiveMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [archives, setArchives] = useState<Array<{ archive_date: string; drive_file_id: string | null; message_count: number }>>([])

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
        <fieldset>
          <legend className="text-sm text-text-2">Date Range</legend>
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
        </fieldset>

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-input bg-accent-1 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {loading ? 'Exporting...' : 'Export as JSON'}
        </button>
      </div>
        <div className="mt-6 border-t border-border/20 pt-5">
          <h4 className="text-sm font-semibold text-text-1">Drive chat archive</h4>
          <p className="mt-1 text-xs text-text-2">Daily chat archives are stored in Drive by year/month and indexed here for quick browsing.</p>
          <input
            type="month"
            value={archiveMonth}
            onChange={(event) => setArchiveMonth(event.target.value)}
            className="mt-3 w-full rounded-input border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"
          />
          <div className="mt-3 space-y-2">
            {archives.length ? archives.map((archive) => (
              <div key={archive.archive_date} className="flex items-center justify-between gap-3 rounded-input border border-border/20 bg-soft-tint px-3 py-2">
                <span className="text-sm text-text-1">{archive.archive_date} · {archive.message_count} messages</span>
                {archive.drive_file_id ? (
                  <a
                    href={'/api/drive/file?fileId=' + encodeURIComponent(archive.drive_file_id) + '&download=1'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent-2 underline"
                  >
                    Open
                  </a>
                ) : <span className="text-xs text-text-2">Archive removed</span>}
              </div>
            )) : <p className="text-xs text-text-2">No Drive archive days indexed for this month yet.</p>}
          </div>
        </div>

    </div>
  )
}
