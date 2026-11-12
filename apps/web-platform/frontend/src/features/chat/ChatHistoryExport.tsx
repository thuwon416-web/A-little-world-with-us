'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import { useLanguage } from '@/contexts/LanguageContext'

type ExportedMessage = { created_at: string }

export default function ChatHistoryExport() {
  const { t } = useLanguage()
  const [exportError, setExportError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('all')
  const [archiveMonth, setArchiveMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [archives, setArchives] = useState<Array<{ archive_date: string; drive_file_id: string | null; message_count: number }>>([])

  useEffect(() => {
    let active = true
    void getCoupleStatus().then(async ({ couple }) => {
      if (!couple) return
      const [year, month] = archiveMonth.split('-').map(Number)
      const start = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10)
      const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
      const { data } = await supabase
        .from('chat_archive_days')
        .select('archive_date,drive_file_id,message_count')
        .eq('couple_id', couple.id)
        .gte('archive_date', start)
        .lt('archive_date', end)
        .order('archive_date', { ascending: false })
      if (active) {
        setArchives((data ?? []) as Array<{ archive_date: string; drive_file_id: string | null; message_count: number }>)
      }
    })
    return () => { active = false }
  }, [archiveMonth])

  const handleExport = async () => {
    setLoading(true)
    setExportError('')
    try {
      const { couple } = await getCoupleStatus()
      if (!couple) {
        setExportError(t('Settings.chatExportNeedsCouple'))
        return
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: true })
      if (error) throw error

      const now = new Date()
      const filtered = ((messages || []) as ExportedMessage[]).filter((msg) => {
        if (dateRange === 'all') return true
        const days = dateRange === '7d' ? 7 : 30
        return new Date(msg.created_at) > new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      })

      const json = JSON.stringify(filtered, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `chat-history-${now.toISOString().split('T')[0]}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Chat history export error:', error)
      setExportError(t('Settings.chatExportError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-accent-1" />
        Export Chat History
      </h3>

      <div className="space-y-3">
        <fieldset>
          <legend className="text-sm text-text-2">{t('Settings.dateRange')}</legend>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDateRange('7d')}
              aria-pressed={dateRange === '7d'}
              className={`min-h-11 flex-1 rounded-input px-3 py-2 text-sm ${
                dateRange === '7d'
                  ? 'bg-accent-1 text-white font-semibold shadow-sm'
                  : 'bg-soft-tint text-text-2'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange('30d')}
              aria-pressed={dateRange === '30d'}
              className={`min-h-11 flex-1 rounded-input px-3 py-2 text-sm ${
                dateRange === '30d'
                  ? 'bg-accent-1 text-white font-semibold shadow-sm'
                  : 'bg-soft-tint text-text-2'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange('all')}
              aria-pressed={dateRange === 'all'}
              className={`min-h-11 flex-1 rounded-input px-3 py-2 text-sm ${
                dateRange === 'all'
                  ? 'bg-accent-1 text-white font-semibold shadow-sm'
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
          className="ui-button-primary min-h-11 w-full rounded-input px-4 py-2 text-sm disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {loading ? t('Settings.exporting') : t('Settings.exportJSON')}
        </button>
      </div>
      {exportError ? <p role="alert" className="mt-3 text-sm text-error">{exportError}</p> : null}
      <div className="mt-6 border-t border-border/20 pt-5">
          <h4 className="text-sm font-semibold text-text-1">{t('Settings.driveChatArchive')}</h4>
          <p className="mt-1 text-xs text-text-2">{t('Settings.archiveDescription')}</p>
          <input
            type="month"
            value={archiveMonth}
            onChange={(event) => setArchiveMonth(event.target.value)}
            className="mt-3 w-full rounded-input border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"
          />
          <div className="mt-3 space-y-2">
            {archives.length ? archives.map((archive) => (
              <div key={archive.archive_date} className="flex items-center justify-between gap-3 rounded-input border border-border/20 bg-soft-tint px-3 py-2">
                <span className="text-sm text-text-1">{archive.archive_date} · {archive.message_count} {t('Settings.messages')}</span>
                {archive.drive_file_id ? (
                  <a
                    href={'/api/drive/file?fileId=' + encodeURIComponent(archive.drive_file_id) + '&download=1'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-accent-2 underline"
                  >
                    Open
                  </a>
                ) : <span className="text-xs text-text-2">{t('Settings.archiveRemoved')}</span>}
              </div>
            )) : <p className="text-xs text-text-2">{t('Settings.noDriveArchive')}</p>}
          </div>
        </div>

    </div>
  )
}
