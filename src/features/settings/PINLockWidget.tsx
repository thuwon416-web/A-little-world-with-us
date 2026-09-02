'use client'

import { useState, useEffect } from 'react'
import { Lock, X } from 'lucide-react'
import { hasPIN, setPIN, removePIN } from '@/lib/pinLock'

export default function PINLockWidget() {
  const [hasPin, setHasPin] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setHasPin(hasPIN())
  }, [])

  const handleSetPIN = async () => {
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    await setPIN(pin)
    setHasPin(true)
    setShowModal(false)
    setPin('')
    setConfirmPin('')
    setError('')
  }

  const handleRemovePIN = async () => {
    if (!confirm('Are you sure you want to remove PIN lock?')) return

    await removePIN()
    setHasPin(false)
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-[var(--accent-1)]" />
        PIN Lock
      </h3>

      {hasPin ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            PIN lock is enabled. You&apos;ll be asked for your PIN when opening the app.
          </p>
          <button
            onClick={handleRemovePIN}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            Remove PIN
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Set a PIN to protect your app with client-side encryption.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-xl bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
          >
            Set PIN
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Set PIN
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">PIN (min 4 digits) *</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="- - - - "
                  maxLength={6}
                />
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Confirm PIN *</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="- - - - "
                  maxLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleSetPIN}
                disabled={pin.length < 4 || pin !== confirmPin}
                className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
              >
                Set PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
