'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { clearErrorLog, getErrorLog, logError } from '@/lib/errorLogger'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ErrorReport() {
  const { t } = useLanguage()
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
    <div className="rounded-panel border border-warning/20 bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-text-2">{t('Settings.diagnostics')}</p>
            <h3 className="text-lg font-semibold text-text-1">{t('Settings.errorReports')}</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {errors.length === 0 ? (
          <p className="rounded-btn border border-border/20 bg-card p-4 text-sm text-text-2">
            No recent errors logged.
          </p>
        ) : (
          errors.slice(0, 3).map((error) => (
            <div key={error.id} className="rounded-btn border border-border/20 bg-card p-4">
              <p className="font-medium text-text-1">{error.name}</p>
              <p className="mt-1 text-sm text-text-2">{error.message}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-text-2">
                {new Date(error.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="mt-4 min-h-11 text-sm text-text-2 underline underline-offset-4"
      >
        Clear local error log
      </button>
    </div>
  )
}
