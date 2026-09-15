'use client'

import { KeyRound, Mail } from 'lucide-react'

export type VaultTab = 'letters' | 'passwords'

type VaultTabsProps = { tab: VaultTab; onChange: (tab: VaultTab) => void }

export default function VaultTabs({ tab, onChange }: VaultTabsProps) {
  return <div className="mb-6 flex gap-2 rounded-2xl bg-[var(--bg-2)] p-1" role="tablist" aria-label="Vault sections">
    <button type="button" role="tab" aria-selected={tab === 'letters'} onClick={() => onChange('letters')} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm ${tab === 'letters' ? 'bg-[var(--button-bg)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}><Mail className="h-4 w-4" />Letters</button>
    <button type="button" role="tab" aria-selected={tab === 'passwords'} onClick={() => onChange('passwords')} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm ${tab === 'passwords' ? 'bg-[var(--button-bg)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}><KeyRound className="h-4 w-4" />Passwords</button>
  </div>
}
