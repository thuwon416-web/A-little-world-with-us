'use client'

import { useEffect, useState } from 'react'
import { decryptCredential } from '@/lib/vault-crypto'
import type { VaultCredential } from '@/services/vault-credentials'

type Health = { weak: VaultCredential[]; reused: VaultCredential[]; old: VaultCredential[]; secure: number }
const isWeak = (password: string) => password.length < 12 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password) || /(1234|password|qwerty|abcd)/i.test(password)

export default function PasswordHealth({ credentials, masterKey, onFocus }: { credentials: VaultCredential[]; masterKey: Uint8Array; onFocus: (ids: string[]) => void }) {
  const [health, setHealth] = useState<Health>({ weak: [], reused: [], old: [], secure: 0 })
  useEffect(() => {
    let active = true
    void Promise.all(credentials.map(async (item) => ({ item, data: await decryptCredential(item.encryptedPayload, item.encryptionIv, masterKey) as { password?: string } }))).then((values) => {
      if (!active) return
      const counts = new Map<string, VaultCredential[]>()
      values.forEach(({ item, data }) => { const password = data.password ?? ''; counts.set(password, [...(counts.get(password) ?? []), item]) })
      const reusedIds = new Set([...counts.values()].filter((items) => items.length > 1).flat().map((item) => item.id))
      const weak = values.filter(({ data }) => isWeak(data.password ?? '')).map(({ item }) => item)
      const old = credentials.filter((item) => Date.now() - new Date(item.updatedAt).getTime() > 365 * 24 * 60 * 60 * 1000)
      setHealth({ weak, reused: credentials.filter((item) => reusedIds.has(item.id)), old, secure: credentials.length - new Set([...weak, ...old, ...credentials.filter((item) => reusedIds.has(item.id))].map((item) => item.id)).size })
    }).catch(() => setHealth({ weak: credentials, reused: [], old: [], secure: 0 }))
    return () => { active = false }
  }, [credentials, masterKey])
  const total = credentials.length
  const score = total ? Math.round((health.secure / total) * 100) : 100
  const categories = [['Weak', health.weak], ['Reused', health.reused], ['Old', health.old]] as const
  return <div className="mb-5 rounded-3xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--accent-1)] text-xl text-[var(--text-primary)]">{score}</div><div><h3 className="text-lg text-[var(--text-primary)]">Password health</h3><p className="text-xs text-[var(--text-secondary)]">{health.secure} of {total} passwords pass all checks</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{categories.map(([label, items]) => <button key={label} type="button" onClick={() => onFocus(items.map((item) => item.id))} className="rounded-2xl bg-[var(--bg-2)] p-3 text-left"><p className="text-xs text-[var(--text-secondary)]">{label}</p><p className="mt-1 text-xl text-[var(--text-primary)]">{items.length}</p><span className="text-xs text-[var(--accent-1)]">Fix</span></button>)}</div></div>
}
