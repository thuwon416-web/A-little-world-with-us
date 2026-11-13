'use client'

import { Circle, MoonStar, Sparkles, SunMedium, Waves } from 'lucide-react'

import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeMode } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'

const themeOptions: Array<{ key: ThemeMode; labelKey: string; icon: typeof Sparkles }> = [
  { key: 'lavender-mist', labelKey: 'themeLavender', icon: MoonStar },
  { key: 'peach-cream', labelKey: 'themePeach', icon: SunMedium },
  { key: 'mint-whisper', labelKey: 'themeMint', icon: Sparkles },
  { key: 'ocean-calm', labelKey: 'themeOcean', icon: Waves },
  { key: 'monochrome', labelKey: 'themeMonochrome', icon: Circle },
]

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-[0.16em] text-text-1/70">
          {t('Settings.themeLabel')}
        </span>
        <span className="text-xs text-text-1/60">{t('Settings.' + ({ 'lavender-mist': 'themeLavender', 'peach-cream': 'themePeach', 'mint-whisper': 'themeMint', 'ocean-calm': 'themeOcean', monochrome: 'themeMonochrome' }[preference]))}</span>
      </div>

      <div className="space-y-2" role="group" aria-label={t('Settings.themeLabel')}>
        {themeOptions.map(({ key, labelKey, icon: Icon }) => {
          const isActive = preference === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPreference(key)
              }}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-full border px-3 py-2 text-left text-sm transition-all ${
                isActive
                  ? 'border-accent-1 bg-accent-1/12 text-text-1 shadow-[0_0_18px_rgb(var(--accent-1)_/_0.2)]'
                  : 'border-accent-1/20 bg-card text-text-1/80 hover:bg-card'
              }`}
              aria-label={`${t('Settings.setTheme')} ${t('Settings.' + labelKey)}`}
              aria-pressed={isActive}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {t(`Settings.${labelKey}`)}
              </span>
              {isActive ? <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-2" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
