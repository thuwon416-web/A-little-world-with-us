'use client'

import { KeyRound, Mail } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export type VaultTab = 'letters' | 'passwords'

type VaultTabsProps = { tab: VaultTab; onChange: (tab: VaultTab) => void }

export default function VaultTabs({ tab, onChange }: VaultTabsProps) {
  const { t } = useLanguage()
  return (
    <div className="mb-6 flex gap-2 rounded-pill bg-soft-tint p-1" role="tablist" aria-label={t('Vault.vault')}>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'letters'}
        onClick={() => onChange('letters')}
        className={`inline-flex flex-1 items-center justify-center gap-2 min-h-11 rounded-pill px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
          tab === 'letters'
            ? 'bg-accent-1 text-white font-semibold shadow-sm shadow-sm'
            : 'text-text-2 hover:text-text-1'
        }`}
      >
        <Mail className="h-4 w-4" /> {t('Vault.letters')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'passwords'}
        onClick={() => onChange('passwords')}
        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
          tab === 'passwords'
            ? 'bg-accent-1 text-white font-semibold shadow-sm shadow-sm'
            : 'text-text-2 hover:text-text-1'
        }`}
      >
        <KeyRound className="h-4 w-4" /> {t('Vault.passwords')}
      </button>
    </div>
  )
}
