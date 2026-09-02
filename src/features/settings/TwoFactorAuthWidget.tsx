'use client'

import { useState, useEffect } from 'react'
import { Shield, X } from 'lucide-react'
import { enable2FA, verify2FA, save2FASecret, get2FASecret, remove2FA } from '@/lib/2fa'

export default function TwoFactorAuthWidget() {
  const [enabled, setEnabled] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const secret = get2FASecret()
    setEnabled(!!secret)
  }, [])

  const handleEnable = async () => {
    const setup = await enable2FA()
    setQrCode(setup.qrCodeUrl)
    setBackupCodes(setup.backupCodes)
    setShowSetupModal(true)
  }

  const handleVerify = async () => {
    const secret = get2FASecret()
    if (!secret) return

    const valid = await verify2FA(secret, verificationCode)
    if (valid) {
      save2FASecret(secret, backupCodes)
      setEnabled(true)
      setShowSetupModal(false)
      setError('')
    } else {
      setError('Invalid code. Please try again.')
    }
  }

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return

    remove2FA()
    setEnabled(false)
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-[var(--accent-1)]" />
        Two-Factor Authentication
      </h3>

      {enabled ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            2FA is enabled. Your account is protected with two-factor authentication.
          </p>
          <button
            onClick={handleDisable}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            Disable 2FA
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Add an extra layer of security to your account with two-factor authentication.
          </p>
          <button
            onClick={handleEnable}
            className="w-full rounded-xl bg-[var(--button-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
          >
            Enable 2FA
          </button>
        </div>
      )}

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Setup 2FA
              </h3>
              <button onClick={() => setShowSetupModal(false)} className="text-[var(--text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                {qrCode && (
                  <img src={qrCode} alt="2FA QR Code for authenticator app" className="w-48 h-48 mx-auto" />
                )}
              </div>

              <div>
                <label className="text-sm text-[var(--text-secondary)]">Enter verification code *</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--accent-1)]/20 bg-[var(--bg-2)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                onClick={handleVerify}
                disabled={!verificationCode}
                className="w-full rounded-xl bg-[var(--button-bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-50"
              >
                Verify & Enable
              </button>

              {backupCodes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">
                    Backup codes (save these in a safe place):
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[var(--bg-2)] p-3 rounded-xl">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="text-[var(--text-primary)]">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
