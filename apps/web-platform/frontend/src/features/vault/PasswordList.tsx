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
import { useLanguage } from '@/contexts/LanguageContext'

type PasswordListProps = { masterKey: Uint8Array }

export default function PasswordList({ masterKey }: PasswordListProps) {
  const { t } = useLanguage()
  const [credentials, setCredentials] = useState<VaultCredential[]>([])
  const [editing, setEditing] = useState<{ credential?: VaultCredential; data?: Record<string, string> } | null>(null)
  const [error, setError] = useState('')
  const [healthOpen, setHealthOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<string[]>([])
  const [transferStatus, setTransferStatus] = useState('')
  const load = async () => { try { setCredentials(await getCredentials()); setError('') } catch (cause) { setError(cause instanceof Error ? cause.message : t('Vault.unableLoadPasswords')) } }
  useEffect(() => { void load() }, [])
  const remove = async (id: string) => { if (!window.confirm(t('Vault.deletePasswordConfirm'))) return; await deleteCredential(id); await load() }
  const download = async () => {
    const content = await exportVault(masterKey, credentials)
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `vault-${new Date().toISOString().slice(0, 10)}.vault`; anchor.click(); URL.revokeObjectURL(url)
    setTransferStatus(t('Vault.archiveDownloaded'))
  }
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    try { const result = await importVault(await file.text(), masterKey); setTransferStatus(t('Vault.archiveRestoredSummary').replace('{imported}', String(result.imported)).replace('{skipped}', String(result.skipped)).replace('{errors}', String(result.errors.length))); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('Vault.importVaultError')) }
  }
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl text-text-1" style={{ fontFamily: 'var(--font-display)' }}>{t('Vault.passwords')}</h2><p className="mt-1 text-sm text-text-2">{t('Vault.passwordsDescription')}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setHealthOpen((value) => !value)} aria-expanded={healthOpen} className="inline-flex min-h-11 items-center gap-1 rounded-btn border border-accent-1/20 px-3 py-2 text-xs text-text-2"><HeartPulse className="h-4 w-4" />{t('Vault.health')}</button><button type="button" onClick={() => void download()} className="rounded-btn border border-accent-1/20 p-2 text-text-2" aria-label={t('Vault.exportPasswordArchive')}><Download className="h-4 w-4" /></button><label className="cursor-pointer rounded-btn border border-accent-1/20 p-2 text-text-2" aria-label={t('Vault.importPasswordArchive')}><Upload className="h-4 w-4" /><input type="file" accept=".vault,application/json" className="hidden" onChange={(event) => void upload(event)} /></label><button type="button" onClick={() => void load()} className="rounded-btn border border-accent-1/20 p-2 text-text-2" aria-label={t('Vault.refreshPasswords')}><RefreshCw className="h-4 w-4" /></button><button type="button" onClick={() => setEditing({})} className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-accent-1 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"><Plus className="h-4 w-4" />{t('Vault.addPassword')}</button></div></div>
      {transferStatus ? <p className="mb-4 rounded-btn bg-accent-1/10 p-3 text-sm text-text-1" role="status" aria-live="polite">{transferStatus}</p> : null}
      {healthOpen ? <PasswordHealth credentials={credentials} masterKey={masterKey} onFocus={setHighlighted} /> : null}
      {error ? <p className="mb-4 rounded-btn bg-error/10 p-4 text-sm text-error" role="alert">{error}</p> : null}
      {credentials.length === 0 ? <div className="rounded-card border border-dashed border-accent-1/30 p-10 text-center text-sm text-text-2">{t('Vault.noPasswords')}</div> : <div className="grid gap-4 md:grid-cols-2">{credentials.map((credential) => <PasswordCard key={credential.id} credential={credential} masterKey={masterKey} highlighted={highlighted.includes(credential.id)} onEdit={(item, data) => setEditing({ credential: item, data })} onDelete={(id) => void remove(id)} />)}</div>}
      {editing ? <PasswordForm masterKey={masterKey} credential={editing.credential} initialData={editing.data} onSaved={() => { setEditing(null); void load() }} onClose={() => setEditing(null)} /> : null}
    </section>
  )
}
