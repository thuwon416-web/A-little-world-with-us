'use client'

import { KeyRound, Mail } from 'lucide-react'

export type VaultTab = 'letters' | 'passwords'

type VaultTabsProps = { tab: VaultTab; onChange: (tab: VaultTab) => void }

export default function VaultTabs({ tab, onChange }: VaultTabsProps) {
  return (
    <div className="mb-6 flex gap-2 rounded-pill bg-soft-tint p-1" role="tablist" aria-label="Vault sections">
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'letters'}
        onClick={() => onChange('letters')}
        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
          tab === 'letters'
            ? 'bg-accent-1 text-[color:var(--accent-foreground)] shadow-sm'
            : 'text-text-2 hover:text-text-1'
        }`}
      >
        <Mail className="h-4 w-4" /> Letters
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'passwords'}
        onClick={() => onChange('passwords')}
        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
          tab === 'passwords'
            ? 'bg-accent-1 text-[color:var(--accent-foreground)] shadow-sm'
            : 'text-text-2 hover:text-text-1'
        }`}
      >
        <KeyRound className="h-4 w-4" /> Passwords
      </button>
    </div>
  )
}
