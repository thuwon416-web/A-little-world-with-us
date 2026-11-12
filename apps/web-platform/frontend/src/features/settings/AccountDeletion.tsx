'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/shared/UI'
import { useLanguage } from '@/contexts/LanguageContext'

type DeletionState = {
  status?: 'scheduled' | 'cancelled'
  scheduledFor?: string
}

export default function AccountDeletion() {
  const { t } = useLanguage()
  const [state, setState] = useState<DeletionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/account/request-delete', { cache: 'no-store' })
      if (!response.ok) throw new Error(t('Settings.loadDeletionError'))
      setState(await response.json() as DeletionState)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to load account deletion status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const requestDeletion = async () => {
    if (busy) return
    const confirmed = window.confirm(
      t('Settings.confirmDeletion')
    )
    if (!confirmed) return

    try {
      setBusy(true)
      setError('')
      const response = await fetch('/api/account/request-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graceDays: 30 }),
      })
      const body = await response.json() as DeletionState & { error?: string }
      if (!response.ok) throw new Error(body.error ?? t('Settings.scheduleDeletionError'))
      setState(body)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to schedule account deletion.')
    } finally {
      setBusy(false)
    }
  }

  const cancelDeletion = async () => {
    if (busy) return
    try {
      setBusy(true)
      setError('')
      const response = await fetch('/api/account/cancel-delete', { method: 'POST' })
      const body = await response.json() as DeletionState & { error?: string }
      if (!response.ok) throw new Error(body.error ?? t('Settings.cancelDeletionError'))
      setState(body)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to cancel account deletion.')
    } finally {
      setBusy(false)
    }
  }

  const scheduled = state?.status === 'scheduled'

  return (
    <section className="rounded-panel border border-error/30 bg-error/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-error">{t('Settings.accountLifecycle')}</p>
      <h3 className="mt-1 text-lg font-semibold text-text-1">{t('Settings.deleteThisAccount')}</h3>
      <p className="mt-2 text-sm text-text-2">
        {t('Settings.deletionGrace')}
      </p>

      {loading ? <p className="mt-3 text-sm text-text-2">{t('Settings.checkingDeletion')}</p> : null}
      {!loading && scheduled ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-text-1">
            {t('Settings.deletionScheduled')}{' '}<strong>{state.scheduledFor ? new Date(state.scheduledFor).toLocaleString() : t('Settings.scheduledDate')}</strong>.
          </p>
          <Button type="button" variant="secondary" className="min-h-11 border-error/30 text-error" onClick={() => void cancelDeletion()} disabled={busy}>
            {busy ? t('Settings.working') : t('Settings.cancelDeletion')}
          </Button>
        </div>
      ) : null}
      {!loading && !scheduled ? (
        <Button type="button" variant="secondary" className="min-h-11 border-error/30 text-error" onClick={() => void requestDeletion()} disabled={busy}>
          {busy ? t('Settings.working') : t('Settings.scheduleDeletion')}
        </Button>
      ) : null}
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </section>
  )
}
