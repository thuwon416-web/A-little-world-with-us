'use client'

import { useId, useState, useEffect } from 'react'
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
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const pinInputId = useId()
  const confirmPinInputId = useId()

  const closeModal = () => {
    setShowModal(false)
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
        body: JSON.stringify({ action: 'hash', pin }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error || 'Failed to set PIN')
        return
      }
      setHasPin(true)
      closeModal()
      setPin('')
      setConfirmPin('')
      setError('')
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to set PIN')
    }
  }

  const handleRemovePIN = async () => {
    if (!confirm('Are you sure you want to remove PIN lock?')) return

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove' }),
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
          <button
            type="button"
            onClick={handleRemovePIN}
            className="w-full rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
          >
            Remove PIN
          </button>
        </div>
      ) : (
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pin-lock-title">
          <div className="glass-card my-8 w-full max-w-sm rounded-modal border border-accent-1/20 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 id="pin-lock-title" className="text-lg font-semibold text-text-1">
                Set PIN
              </h3>
              <button type="button" onClick={closeModal} className="text-text-2" aria-label="Close PIN setup">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor={pinInputId} className="text-sm text-text-2">PIN (4-6 digits) *</label>
                <input
                  id={pinInputId}
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"
                  placeholder="- - - - "
                  maxLength={6}
                />
              </div>

              <div>
                <label htmlFor={confirmPinInputId} className="text-sm text-text-2">Confirm PIN *</label>
                <input
                  id={confirmPinInputId}
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-2 text-sm text-text-1"
                  placeholder="- - - - "
                  maxLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-error">{error}</p>
              )}

              <button
                type="button"
                onClick={handleSetPIN}
                disabled={!/^\d{4,6}$/.test(pin) || pin !== confirmPin}
                className="w-full rounded-xl bg-accent-1 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Set PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
