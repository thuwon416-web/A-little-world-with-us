'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound, X } from 'lucide-react'
import PasswordGenerator from './PasswordGenerator'
import { encryptCredential } from '@/lib/vault-crypto'
import { createCredential, updateCredential, type VaultCredential } from '@/services/vault-credentials'

const CATEGORIES = ['email', 'social', 'banking', 'shopping', 'work', 'streaming', 'other'] as const
const inputClass = 'mt-2 w-full rounded-btn border border-accent-1/20 bg-soft-tint px-4 py-3 text-sm text-text-1 outline-none placeholder:text-text-2'
type PasswordFormProps = {
  masterKey: Uint8Array
  credential?: VaultCredential | null
  initialData?: Record<string, string>
  onSaved: () => void
  onClose: () => void
}

export default function PasswordForm({ masterKey, credential, initialData, onSaved, onClose }: PasswordFormProps) {
  const [label, setLabel] = useState(credential?.label ?? '')
  const [username, setUsername] = useState(initialData?.username ?? '')
  const [password, setPassword] = useState(initialData?.password ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(credential?.websiteUrl ?? '')
  const [category, setCategory] = useState(credential?.category ?? 'other')
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [isShared, setIsShared] = useState(credential?.isShared ?? false)
  const [showPassword, setShowPassword] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!label.trim() || !password) { setError('Label and password are required.'); return }
    setSaving(true); setError('')
    try {
      const encrypted = await encryptCredential({ title: label.trim(), username, password, url: websiteUrl, notes }, masterKey)
      const input = { isShared, encryptedPayload: encrypted.encryptedPayload, encryptionIv: encrypted.iv, encryptionVersion: 1, category, label: label.trim(), websiteUrl: websiteUrl || null, keyVersion: 1 }
      if (credential) await updateCredential(credential.id, input)
      else await createCredential(input)
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save password.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="my-8 w-full max-w-2xl rounded-modal border border-accent-1/20 bg-card p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between"><h2 className="text-2xl text-text-1" style={{ fontFamily: 'var(--font-display)' }}>{credential ? 'Edit password' : 'Add password'}</h2><button type="button" onClick={onClose} aria-label="Close form"><X className="h-5 w-5 text-text-2" /></button></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-text-2">Label<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Gmail" className={inputClass} /></label>
          <label className="text-sm text-text-2">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>{CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-sm text-text-2">Username<input value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} /></label>
          <label className="text-sm text-text-2">Website URL<input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://" className={inputClass} /></label>
          <label className="text-sm text-text-2 md:col-span-2">Password<div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className={`${inputClass} pr-24`} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-12 top-5 text-text-2">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button type="button" onClick={() => setShowGenerator(true)} className="absolute right-3 top-5 text-accent-1" aria-label="Generate password"><KeyRound className="h-4 w-4" /></button></div></label>
          <label className="text-sm text-text-2 md:col-span-2">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className={`${inputClass} resize-none`} /></label>
          <label className="flex items-center gap-2 text-sm text-text-1 md:col-span-2"><input type="checkbox" checked={isShared} onChange={(event) => setIsShared(event.target.checked)} /> Share with my partner</label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-btn px-4 py-2 text-sm text-text-2">Cancel</button><button type="button" onClick={save} disabled={saving} className="rounded-btn bg-accent-1 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save password'}</button></div>
      </div>
      {showGenerator ? <PasswordGenerator onSelect={setPassword} onClose={() => setShowGenerator(false)} /> : null}
    </div>
  )
}
