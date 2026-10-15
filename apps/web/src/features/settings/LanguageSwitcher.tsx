'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Globe className="h-5 w-5 text-accent-1" />
        Language / ဘာသာစကား
      </h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setLanguage('my')}
          className={`flex-1 rounded-pill px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
            language === 'my'
              ? 'bg-accent-1 text-[color:var(--accent-foreground)] shadow-sm'
              : 'bg-soft-tint text-text-2 hover:bg-card-hover'
          }`}
        >
          မြန်မာ
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex-1 rounded-pill px-4 py-2 text-sm font-medium transition active:scale-[0.98] ${
            language === 'en'
              ? 'bg-accent-1 text-[color:var(--accent-foreground)] shadow-sm'
              : 'bg-soft-tint text-text-2 hover:bg-card-hover'
          }`}
        >
          English
        </button>
      </div>
    </div>
  )
}
