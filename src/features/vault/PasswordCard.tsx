'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Edit3, Eye, EyeOff, Globe, LockKeyhole, Trash2 } from 'lucide-react'
import { decryptCredential } from '@/lib/vault-crypto'
import type { VaultCredential as VaultCredentialRecord } from '@/services/vault-credentials'

type PasswordCardProps = {
  credential: VaultCredentialRecord
  masterKey: Uint8Array
  onEdit: (credential: VaultCredentialRecord, data: Record<string, string>) => void
  onDelete: (id: string) => void
  highlighted?: boolean
}

export default function PasswordCard({ credential, masterKey, onEdit, onDelete, highlighted }: PasswordCardProps) {
  const [data, setData] = useState<Record<string, string> | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => () => setData(null), [])

  const reveal = async () => {
    if (!data) {
      const decrypted = await decryptCredential(credential.encryptedPayload, credential.encryptionIv, masterKey)
      setData(decrypted as Record<string, string>)
    }
    setRevealed(true)
    window.setTimeout(() => setRevealed(false), 30_000)
  }

  const edit = async () => {
    const current = data ?? await decryptCredential(credential.encryptedPayload, credential.encryptionIv, masterKey) as Record<string, string>
    onEdit(credential, current)
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <article className={`rounded-panel border bg-card p-5 shadow-md backdrop-blur-xl ${highlighted ? 'border-amber-300 ring-2 ring-amber-300/30' : 'border-accent-1/20'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-btn bg-accent-1 text-white"><Globe className="h-5 w-5" /></div>
          <div>
            <h3 className="font-medium text-text-1">{credential.label}</h3>
            <p className="text-xs capitalize text-text-2">{credential.category}{credential.isShared ? ' · Shared' : ''}</p>
          </div>
        </div>
        <button type="button" onClick={reveal} aria-label={revealed ? 'Hide password' : 'Reveal password'} className="rounded-xl p-2 text-text-2 hover:bg-soft-tint">{revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      </div>
      {revealed && data ? (
        <div className="mt-4 space-y-2 border-t border-accent-1/10 pt-4 text-sm text-text-1">
          <p><span className="text-text-2">Username:</span> {data.username || '—'} <button type="button" onClick={() => copy(data.username || '')} className="ml-2 text-accent-1"><Copy className="inline h-3.5 w-3.5" /></button></p>
          <p><span className="text-text-2">Password:</span> <span className="font-mono">{data.password || '—'}</span> <button type="button" onClick={() => copy(data.password || '')} className="ml-2 text-accent-1">{copied ? <Check className="inline h-3.5 w-3.5" /> : <Copy className="inline h-3.5 w-3.5" />}</button></p>
          {data.notes ? <p className="whitespace-pre-wrap text-text-2">{data.notes}</p> : null}
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={() => void edit()} className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs text-text-2 hover:bg-soft-tint"><Edit3 className="h-3.5 w-3.5" />Edit</button>
        <button type="button" onClick={() => onDelete(credential.id)} className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs text-red-300 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" />Delete</button>
        <LockKeyhole className="ml-1 h-3.5 w-3.5 text-text-2" />
      </div>
    </article>
  )
}
