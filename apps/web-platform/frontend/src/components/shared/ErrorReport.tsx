'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { clearErrorLog, getErrorLog } from '@/lib/errorLogger'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ErrorReport() {
  const { t } = useLanguage()
  const [errors, setErrors] = useState(getErrorLog())

  useEffect(() => {
    setErrors(getErrorLog())
  }, [])

  const handleRefresh = () => {
    setErrors(getErrorLog())
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
          onClick={handleRefresh}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent-1/20 bg-card px-3 py-2 text-sm text-text-1"
        >
          <RefreshCw className="h-4 w-4" />
          {t('Settings.refresh')}
        </button>
      </div>

      <div className="space-y-3" aria-live="polite">
        {errors.length === 0 ? (
          <p className="rounded-btn border border-border/20 bg-card p-4 text-sm text-text-2">
            {t('Settings.noRecentErrors')}
          </p>
        ) : (
          errors.slice(0, 3).map((error) => (
            <div key={error.id} className="rounded-btn border border-border/20 bg-card p-4">
              <p className="font-medium text-text-1">{error.name}</p>
              <p className="mt-1 text-sm text-text-2">{error.message}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-text-2">
                {new Date(error.timestamp).toLocaleString()}
              </p>
              {(error.context?.source || error.context?.component || error.context?.componentStack || error.stack) ? (
                <details className="mt-3 rounded-lg border border-border/40 bg-soft-tint p-3">
                  <summary className="cursor-pointer text-xs font-medium text-text-2">{t('Settings.errorDetails')}</summary>
                  {typeof error.context?.source === 'string' ? <p className="mt-2 text-xs text-text-2">{t('Settings.errorSource')}: {error.context.source}</p> : null}
                  {typeof error.context?.component === 'string' ? <p className="mt-1 text-xs text-text-2">{t('Settings.errorComponent')}: {error.context.component}</p> : null}
                  {typeof error.context?.componentStack === 'string' ? <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px] text-text-2">{error.context.componentStack.split('\n').slice(0, 8).join('\n')}</pre> : null}
                  {typeof error.stack === 'string' ? <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px] text-text-2">{error.stack.split('\n').slice(0, 10).join('\n')}</pre> : null}
                </details>
              ) : null}
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={handleClear}
        className="mt-4 min-h-11 text-sm text-text-2 underline underline-offset-4"
      >
        {t('Settings.clearErrorLog')}
      </button>
    </div>
  )
}
