'use client'

import { useId, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Lock, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { t } = useLanguage()
  const pinInputId = useId()
  const confirmPinInputId = useId()

  const closeModal = () => {
    setShowModal(false)
    setCurrentPin('')
    setPin('')
    setConfirmPin('')
    setError('')
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
        if (!response.ok) throw new Error(result.error || t('Settings.loadPINError'))
        setHasPin(Boolean(result.hasPIN))
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : 'Unable to load PIN status')
      }
    }
    void loadStatus()
  }, [])

  const openModal = () => {
    setError('')
    setShowModal(true)
    onModalOpen()
  }

  const handleSetPIN = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError(t('Settings.pinDigitsError'))
      return
    }
    if (pin !== confirmPin) {
      setError(t('Settings.pinMismatch'))
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
        setError(result.error || t('Settings.savePINError'))
        return
      }
      setHasPin(true)
      closeModal()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to save PIN')
    }
  }

  const handleRemovePIN = async () => {
    if (!window.confirm(t('Settings.removePINConfirm'))) return
    const current = window.prompt(t('Settings.enterCurrentPIN')) ?? ''
    if (!/^\d{4,6}$/.test(current)) return

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', currentPin: current }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) {
        setError(result.error || t('Settings.removePINError'))
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
            <p className="text-xs uppercase tracking-[0.18em] text-text-2">{t('Settings.privateProtection')}</p>
            <h3 id="pin-lock-title" className="mt-1 text-lg font-semibold text-text-1">
              {hasPin ? t('Settings.changePIN') : t('Settings.setPIN')}
            </h3>
          </div>
          <button type="button" onClick={closeModal} className="min-h-11 min-w-11 rounded-full p-2 text-text-2 transition hover:bg-soft-tint hover:text-text-1" aria-label={t('Settings.closePINSetup')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {hasPin ? (
            <div>
              <label htmlFor="current-pin" className="text-sm font-medium text-text-1">{t('Settings.currentPIN')} *</label>
              <input
                id="current-pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={currentPin}
                onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-base tracking-[0.35em] text-text-1 outline-none"
                placeholder="••••"
                maxLength={6}
              />
            </div>
          ) : null}

          <div>
            <label htmlFor={pinInputId} className="text-sm font-medium text-text-1">
              {hasPin ? t('Settings.newPIN') : t('Settings.pin')} ({t('Settings.pinDigits')}) *
            </label>
            <input
              id={pinInputId}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-base tracking-[0.35em] text-text-1 outline-none transition focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15"
              placeholder="••••"
              maxLength={6}
              autoFocus={!hasPin}
            />
          </div>

          <div>
            <label htmlFor={confirmPinInputId} className="text-sm font-medium text-text-1">{t('Settings.confirmPIN')} *</label>
            <input
              id={confirmPinInputId}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-accent-1/20 bg-soft-tint px-3 py-3 text-base tracking-[0.35em] text-text-1 outline-none transition focus:border-accent-1/50 focus:ring-2 focus:ring-accent-1/15"
              placeholder="••••"
              maxLength={6}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void handleSetPIN()}
            disabled={!/^\d{4,6}$/.test(pin) || pin !== confirmPin || (hasPin && !/^\d{4,6}$/.test(currentPin))}
            className="w-full rounded-pill bg-accent-1 px-4 py-3 text-sm font-semibold text-white font-semibold shadow-sm shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {hasPin ? t('Settings.changePIN') : t('Settings.setPIN')}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <section className="glass-card min-h-[180px] rounded-panel border border-accent-1/15 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-1">
        <Lock className="h-5 w-5 text-accent-1" />
        PIN Lock
      </h3>

      {hasPin ? (
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            {t('Settings.pinEnabled')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={openModal}
              disabled={modalBlocked}
              className="w-full rounded-pill bg-accent-1 px-3 py-2 text-sm font-medium text-white font-semibold shadow-sm shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change PIN
            </button>
            <button
              type="button"
              onClick={() => void handleRemovePIN()}
              className="w-full rounded-pill border border-error/30 bg-error/10 px-3 py-2 text-sm text-error transition hover:bg-error/20 active:scale-[0.98]"
            >
              Remove PIN
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-2">
            {t('Settings.setPINDescription')}
          </p>
          <button
            type="button"
            onClick={openModal}
            disabled={modalBlocked}
            className="w-full rounded-pill bg-accent-1 px-3 py-2 text-sm font-medium text-white font-semibold shadow-sm shadow-sm transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set PIN
          </button>
        </div>
      )}

      {typeof document !== 'undefined' && modal ? createPortal(modal, document.body) : null}
    </section>
  )
}
