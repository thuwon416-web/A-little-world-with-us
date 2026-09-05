'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Globe className="h-5 w-5 text-[var(--accent-1)]" />
        Language / ဘာသာစကား
      </h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setLanguage('mm')}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${
            language === 'mm'
              ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
              : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
          }`}
        >
          မြန်မာ
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium ${
            language === 'en'
              ? 'bg-[var(--button-bg)] text-[var(--text-primary)]'
              : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
          }`}
        >
          English
        </button>
      </div>
    </div>
  )
}
