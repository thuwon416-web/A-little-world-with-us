'use client'

import { useEffect, useState } from 'react'
import { Download, HeartPulse, Plus, RefreshCw, Upload } from 'lucide-react'
import PasswordCard from './PasswordCard'
import PasswordForm from './PasswordForm'
import type { VaultCredential } from '@/services/vault-credentials'
import { deleteCredential, getCredentials } from '@/services/vault-credentials'
import PasswordHealth from './PasswordHealth'
import { exportVault } from '@/lib/vault-export'
import { importVault } from '@/lib/vault-import'

type PasswordListProps = { masterKey: Uint8Array }

export default function PasswordList({ masterKey }: PasswordListProps) {
  const [credentials, setCredentials] = useState<VaultCredential[]>([])
  const [editing, setEditing] = useState<{ credential?: VaultCredential; data?: Record<string, string> } | null>(null)
  const [error, setError] = useState('')
  const [healthOpen, setHealthOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<string[]>([])
  const load = async () => { try { setCredentials(await getCredentials()); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load passwords.') } }
  useEffect(() => { void load() }, [])
  const remove = async (id: string) => { if (!window.confirm('Delete this password?')) return; await deleteCredential(id); await load() }
  const download = async () => {
    const content = await exportVault(masterKey, credentials)
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `vault-${new Date().toISOString().slice(0, 10)}.vault`; anchor.click(); URL.revokeObjectURL(url)
  }
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    try { const result = await importVault(await file.text(), masterKey); window.alert(`Imported ${result.imported}; skipped ${result.skipped}.${result.errors.length ? ` Errors: ${result.errors.join(' ')}` : ''}`); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to import Vault export.') }
  }
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Passwords</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Encrypted credentials for the two of you.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setHealthOpen((value) => !value)} className="inline-flex items-center gap-1 rounded-2xl border border-[var(--accent-1)]/20 px-3 py-2 text-xs text-[var(--text-secondary)]"><HeartPulse className="h-4 w-4" />Health</button><button type="button" onClick={() => void download()} className="rounded-2xl border border-[var(--accent-1)]/20 p-2 text-[var(--text-secondary)]" aria-label="Export passwords"><Download className="h-4 w-4" /></button><label className="cursor-pointer rounded-2xl border border-[var(--accent-1)]/20 p-2 text-[var(--text-secondary)]" aria-label="Import passwords"><Upload className="h-4 w-4" /><input type="file" accept=".vault,application/json" className="hidden" onChange={(event) => void upload(event)} /></label><button type="button" onClick={() => void load()} className="rounded-2xl border border-[var(--accent-1)]/20 p-2 text-[var(--text-secondary)]" aria-label="Refresh passwords"><RefreshCw className="h-4 w-4" /></button><button type="button" onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--button-bg)] px-4 py-2 text-sm text-[var(--text-primary)]"><Plus className="h-4 w-4" />Add password</button></div></div>
      {healthOpen ? <PasswordHealth credentials={credentials} masterKey={masterKey} onFocus={setHighlighted} /> : null}
      {error ? <p className="mb-4 rounded-2xl bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
      {credentials.length === 0 ? <div className="rounded-[28px] border border-dashed border-[var(--accent-1)]/30 p-10 text-center text-sm text-[var(--text-secondary)]">No passwords yet</div> : <div className="grid gap-4 md:grid-cols-2">{credentials.map((credential) => <PasswordCard key={credential.id} credential={credential} masterKey={masterKey} highlighted={highlighted.includes(credential.id)} onEdit={(item, data) => setEditing({ credential: item, data })} onDelete={(id) => void remove(id)} />)}</div>}
      {editing ? <PasswordForm masterKey={masterKey} credential={editing.credential} initialData={editing.data} onSaved={() => { setEditing(null); void load() }} onClose={() => setEditing(null)} /> : null}
    </section>
  )
}
