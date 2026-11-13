'use client'

import { useId, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Check, Copy, ShieldCheck, X } from 'lucide-react'
import { generateBackupKeyPhrase } from '@/lib/vault-crypto'
import { useVaultKey } from '@/contexts/VaultKeyContext'

type VaultSetupModalProps = { onClose: () => void }
const inputClass = 'min-h-11 w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-sm text-text-1 outline-none placeholder:text-text-2'

export default function VaultSetupModal({ onClose }: VaultSetupModalProps) {
  const { t } = useLanguage()
  const titleId = useId()
  const { setupWithPassphrase } = useVaultKey()
  const [step, setStep] = useState(1)
  const [passphrase, setPassphrase] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [phrase] = useState(() => generateBackupKeyPhrase())
  const [error, setError] = useState('')

  const next = async () => {
    if (step === 1) {
      if (passphrase.length < 8 || passphrase !== confirmation) { setError(t('Vault.passphraseMismatch')); return }
      try {
        await setupWithPassphrase(passphrase, phrase)
        setError('')
        setStep(2)
      } catch (cause) { setError(cause instanceof Error ? cause.message : t('Vault.unableSetupPassphrase')) }
      return
    }
    setStep(3)
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-1/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={(event) => { if (event.key === "Escape") onClose() }} className="w-full max-w-lg rounded-panel border border-accent-1/20 bg-card p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between"><h2 className="text-2xl text-text-1" style={{ fontFamily: 'var(--font-display)' }}>{t('Vault.setupPassphraseTitle')}</h2><button type="button" onClick={onClose} aria-label={t('Vault.closeSetup')}><X className="h-5 w-5 text-text-2" /></button></div>
      {step === 1 ? <div className="mt-5 space-y-4"><p className="text-sm text-text-2">{t('Vault.passphraseProtection')}</p><input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder={t('Vault.passphrasePlaceholder')} className={inputClass} /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={t('Vault.confirmPassphrase')} className={inputClass} /></div> : step === 2 ? <div className="mt-5"><div className="rounded-btn bg-warning/10 p-4 text-sm text-warning"><ShieldCheck className="mb-2 h-5 w-5" />{t('Vault.saveBackupPhrase')}</div><p className="mt-4 rounded-btn bg-soft-tint p-4 font-mono text-sm leading-7 text-text-1">{phrase.join(' ')}</p><button type="button" onClick={() => void navigator.clipboard.writeText(phrase.join(' '))} className="mt-3 inline-flex items-center gap-2 text-sm text-accent-1"><Copy className="h-4 w-4" />{t('Vault.copyPhrase')}</button></div> : <div className="mt-5 text-sm text-text-2"><Check className="mb-3 h-8 w-8 text-success" /><p>{t('Vault.vaultReady')} {t('Vault.biometricLater')}</p></div>}
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-11 rounded-pill px-4 py-2 text-sm text-text-2 hover:bg-card-hover transition">{step === 3 ? t('Vault.done') : t('Vault.cancel')}</button>{step < 3 ? <button type="button" onClick={() => void next()} className="min-h-11 rounded-pill bg-accent-1 px-4 py-2 text-sm font-medium text-white font-semibold shadow-sm transition hover:opacity-95 active:scale-[0.98]">{step === 1 ? t('Vault.createPassphrase') : t('Vault.savedIt')}</button> : null}</div>
    </div>
  </div>
}
