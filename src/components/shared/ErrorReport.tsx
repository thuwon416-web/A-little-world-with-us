'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { clearErrorLog, getErrorLog, logError } from '@/lib/errorLogger'

export default function ErrorReport() {
  const [errors, setErrors] = useState(getErrorLog())

  useEffect(() => {
    setErrors(getErrorLog())
  }, [])

  const handleGenerateReport = () => {
    const reportError = logError(new Error('Manual error report requested'), {
      source: 'error-report-panel',
    })
    setErrors((current) => [reportError, ...current].slice(0, 5))
  }

  const handleClear = () => {
    clearErrorLog()
    setErrors([])
  }

  return (
    <div className="rounded-[28px] border border-amber-300/20 bg-[var(--card-bg)] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/10 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Diagnostics</p>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Error reports</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {errors.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[var(--card-bg-strong)] p-4 text-sm text-[var(--text-secondary)]">
            No recent errors logged.
          </p>
        ) : (
          errors.slice(0, 3).map((error) => (
            <div key={error.id} className="rounded-2xl border border-white/10 bg-[var(--card-bg-strong)] p-4">
              <p className="font-medium text-[var(--text-primary)]">{error.name}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{error.message}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {new Date(error.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="mt-4 text-sm text-[var(--text-secondary)] underline underline-offset-4"
      >
        Clear local error log
      </button>
    </div>
  )
}
