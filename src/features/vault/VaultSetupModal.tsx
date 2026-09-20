'use client'

import { useState } from 'react'
import { Check, Copy, ShieldCheck, X } from 'lucide-react'
import { generateBackupKeyPhrase } from '@/lib/vault-crypto'
import { useVaultKey } from '@/contexts/VaultKeyContext'

type VaultSetupModalProps = { onClose: () => void }
const inputClass = 'w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-sm text-text-1 outline-none placeholder:text-text-2'

export default function VaultSetupModal({ onClose }: VaultSetupModalProps) {
  const { unlockWithPassphrase } = useVaultKey()
  const [step, setStep] = useState(1)
  const [passphrase, setPassphrase] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [phrase] = useState(() => generateBackupKeyPhrase())
  const [error, setError] = useState('')

  const next = async () => {
    if (step === 1) {
      if (passphrase.length < 8 || passphrase !== confirmation) { setError('Use an 8+ character passphrase and confirm it exactly.'); return }
      try {
        await unlockWithPassphrase(passphrase)
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passphrase))
        localStorage.setItem('a-little-world-vault-passphrase-hash', Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(''))
        setError('')
        setStep(2)
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to set up passphrase.') }
      return
    }
    setStep(3)
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-lg rounded-modal border border-accent-1/20 bg-card p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between"><h2 className="text-2xl text-text-1" style={{ fontFamily: 'var(--font-display)' }}>Set up Vault Passphrase</h2><button type="button" onClick={onClose} aria-label="Close setup"><X className="h-5 w-5 text-text-2" /></button></div>
      {step === 1 ? <div className="mt-5 space-y-4"><p className="text-sm text-text-2">This passphrase protects your encrypted passwords. It cannot be recovered by the server.</p><input type="password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} placeholder="Passphrase (8+ characters)" className={inputClass} /><input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirm passphrase" className={inputClass} /></div> : step === 2 ? <div className="mt-5"><div className="rounded-btn bg-amber-400/10 p-4 text-sm text-amber-100"><ShieldCheck className="mb-2 h-5 w-5" />Save this backup phrase somewhere private. It is the only recovery option.</div><p className="mt-4 rounded-btn bg-soft-tint p-4 font-mono text-sm leading-7 text-text-1">{phrase.join(' ')}</p><button type="button" onClick={() => void navigator.clipboard.writeText(phrase.join(' '))} className="mt-3 inline-flex items-center gap-2 text-sm text-accent-1"><Copy className="h-4 w-4" />Copy phrase</button></div> : <div className="mt-5 text-sm text-text-2"><Check className="mb-3 h-8 w-8 text-emerald-400" /><p>Your encrypted password vault is ready. Biometric/WebAuthn unlock can be enabled in a later phase.</p></div>}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-btn px-4 py-2 text-sm text-text-2">{step === 3 ? 'Done' : 'Cancel'}</button>{step < 3 ? <button type="button" onClick={() => void next()} className="rounded-btn bg-accent-1 px-4 py-2 text-sm text-white">{step === 1 ? 'Create passphrase' : 'I saved it'}</button> : null}</div>
    </div>
  </div>
}
