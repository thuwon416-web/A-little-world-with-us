'use client'

import { useId, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Lock, X } from 'lucide-react'

export default function PINLockWidget({
  modalBlocked,
  onModalOpen,
  onModalClose,
}: Readonly<{
  modalBlocked: boolean
  onModalOpen: () => void
  onModalClose: () => void
}>) {
  const [hasPin, setHasPin] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const pinInputId = useId()
  const confirmPinInputId = useId()

  const closeModal = () => {
    setShowModal(false)
    setCurrentPin('')
    setPin('')
    setConfirmPin('')
    onModalClose()
  }

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/auth/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status' }),
        })
        const result = await response.json() as { hasPIN?: boolean; error?: string }
        if (!response.ok) throw new Error(result.error || 'Unable to load PIN status')
        setHasPin(Boolean(result.hasPIN))
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Unable to load PIN status')
      }
    }
    void loadStatus()
  }, [])

  const handleSetPIN = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4 to 6 digits')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hash', pin, currentPin: hasPin ? currentPin : undefined }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error || 'Failed to set PIN')
        return
      }
      setHasPin(true)
      closeModal()
      setCurrentPin('')
      setPin('')
      setConfirmPin('')
      setError('')
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to set PIN')
    }
  }

  const handleRemovePIN = async () => {
    if (!confirm('Are you sure you want to remove PIN lock?')) return

    const currentPin = window.prompt('Enter your current PIN to remove PIN lock.') ?? ''
    if (!/^\d{4,6}$/.test(currentPin)) return

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', currentPin }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error || 'Failed to remove PIN')
        return
      }
      setHasPin(false)
      setError('')
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to remove PIN')
    }
  }

  useEffect(() => {
    if (!showModal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showModal])

  const modal = showModal ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-lock-title"
    >
      <div className="my-8 w-full max-w-sm rounded-modal border border-accent-1/20 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-2">Private protection</p>
            <h3 id="pin-lock-title" className="mt-1 text-lg font-semibold text-text-1">
              {hasPin ? 'Change PIN' : 'Set PIN'}
            </h3>
          </div>
          <button type="button" onClick={closeModal} className="rounded-full p-2 text-text-2 transition hover:bg-soft-tint hover:text-text-1" aria-label="Close PIN setup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {hasPin ? <div>
            <label htmlFor="current-pin" className="text-sm font-medium text-text-1">Current PIN *</label>
            <input id="current-pin" type="password" inputMode="numeric" autoComplete="current-password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-base tracking-[0.35em] text-text-1 outline-none" placeholder="••••" maxLength={6} autoFocus />
          </div> : null}

          <div>
            <label htmlFor={pinInputId} className="text-sm font-medium text-text-1">New PIN (4-6 digits) *</label>
            <input
              id={pinInputId}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-base tracking-[0.35em] text-text-1 outline-none transition focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15"
              placeholder="••••"
              maxLength={6}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor={confirmPinInputId} className="text-sm font-medium text-text-1">Confirm PIN *</label>
            <input
              id={confirmPinInputId}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-base tracking-[0.35em] text-text-1 outline-none transition focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15"
              placeholder="••••"
              maxLength={6}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-sm text-error" role="alert">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSetPIN}
            disabled={!/^\d{4,6}$/.test(pin) || pin !== confirmPin || (hasPin && !/^\d{4,6}$/.test(currentPin))}
            className="w-full rounded-xl bg-accent-1 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <section className="glass-card min-h-[180px] rounded-panel border border-accent-1/15 p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-accent-1" />
        PIN Lock
      </h3>

      {hasPin ? (
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            PIN lock is enabled. You&apos;ll be asked for your PIN when opening the app.
          </p>
          <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowModal(true); onModalOpen() }}
            className="w-full rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
          >
            Remove PIN
          >Change PIN</button>
          <button
            type="button"
            onClick={handleRemovePIN}
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            Set a PIN to protect your app and private vault.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowModal(true)
              onModalOpen()
            }}
            disabled={modalBlocked}
            className="w-full rounded-xl bg-accent-1 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set PIN
          </button>
        </div>
      )}

      {typeof document !== 'undefined' && modal ? createPortal(modal, document.body) : null}

    </section>
  )
}
