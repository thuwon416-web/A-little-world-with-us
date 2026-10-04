'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/shared/UI'

type DeletionState = {
  status?: 'scheduled' | 'cancelled'
  scheduledFor?: string
}

export default function AccountDeletion() {
  const [state, setState] = useState<DeletionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/account/request-delete', { cache: 'no-store' })
      if (!response.ok) throw new Error('Unable to load account deletion status.')
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
      'Schedule account deletion for 30 days from now? You can cancel during the grace period. Export anything you want to keep first.'
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
      if (!response.ok) throw new Error(body.error ?? 'Unable to schedule account deletion.')
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
      if (!response.ok) throw new Error(body.error ?? 'Unable to cancel account deletion.')
      setState(body)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to cancel account deletion.')
    } finally {
      setBusy(false)
    }
  }

  const scheduled = state?.status === 'scheduled'

  return (
    <section className="rounded-[24px] border border-error/30 bg-error/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-error">Account lifecycle</p>
      <h3 className="mt-1 text-lg font-semibold text-text-1">Delete this account</h3>
      <p className="mt-2 text-sm text-text-2">
        Account deletion uses a 30-day grace period. Personal account data is erased when the scheduled
        job runs. Shared couple data follows the app&apos;s current data-ownership rules.
      </p>

      {loading ? <p className="mt-3 text-sm text-text-2">Checking deletion status…</p> : null}
      {!loading && scheduled ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-text-1">
            Deletion scheduled for{' '}
            <strong>{state.scheduledFor ? new Date(state.scheduledFor).toLocaleString() : 'the scheduled date'}</strong>.
          </p>
          <Button type="button" variant="secondary" onClick={() => void cancelDeletion()} disabled={busy}>
            {busy ? 'Working…' : 'Cancel deletion'}
          </Button>
        </div>
      ) : null}
      {!loading && !scheduled ? (
        <Button type="button" variant="secondary" onClick={() => void requestDeletion()} disabled={busy}>
          {busy ? 'Working…' : 'Schedule account deletion'}
        </Button>
      ) : null}
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </section>
  )
}
