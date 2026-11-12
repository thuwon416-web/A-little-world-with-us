'use client'

import { useState } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { useAIGuardian } from '@/features/ai-guardian/useAIGuardian'
import type { AIPrivacySettings } from '@/features/ai-guardian/contexts/privacy-context'
import { useLanguage } from '@/contexts/LanguageContext'

const privacyOptions: Array<{
  key: keyof AIPrivacySettings
  labelKey: string
  descriptionKey: string
}> = [
  { key: 'allow_ai_read_mood', labelKey: 'mood', descriptionKey: 'moodDescription' },
  { key: 'allow_ai_read_cycle', labelKey: 'cycleWellness', descriptionKey: 'cycleDescription' },
  { key: 'allow_ai_read_chat', labelKey: 'chatMessages', descriptionKey: 'chatDescription' },
  { key: 'allow_ai_read_location', labelKey: 'location', descriptionKey: 'locationDescription' },
  { key: 'allow_ai_read_finance', labelKey: 'finance', descriptionKey: 'financeDescription' },
]

export default function AIPrivacySettings() {
  const { privacy, loading, error, updatePrivacy } = useAIGuardian()
  const { t } = useLanguage()
  const [savingKey, setSavingKey] = useState<keyof AIPrivacySettings | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggle = async (key: keyof AIPrivacySettings) => {
    setSavingKey(key)
    setSaveError(null)
    try {
      await updatePrivacy({ [key]: !privacy[key] })
    } catch (caughtError) {
      setSaveError(caughtError instanceof Error ? caughtError.message : t('Settings.privacySaveError'))
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section className="space-y-4 rounded-[22px] border border-accent-1/20 bg-card p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-accent-2" />
        <div>
          <h3 className="font-semibold text-text-1">{t('Settings.aiPrivacyTitle')}</h3>
          <p className="mt-1 text-sm text-text-2">
            {t('Settings.aiPrivacyDescription')}
          </p>
        </div>
      </div>

      {(error || saveError) && (
        <div className="flex items-start gap-2 rounded-xl bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{saveError || error}</p>
        </div>
      )}

      <div className="space-y-3">
        {privacyOptions.map(({ key, labelKey, descriptionKey }) => {
          const enabled = privacy[key]
          const saving = savingKey === key
          return (
            <div key={key} className="flex items-center justify-between gap-4 rounded-[18px] border border-border/20 p-3">
              <div>
                <p className="font-medium text-text-1">{t(`Settings.${labelKey}`)}</p>
                <p className="text-sm text-text-2">{t(`Settings.${descriptionKey}`)}</p>
                <p className="mt-1 text-xs text-text-2">{enabled ? t('Settings.enabled') : t('Settings.disabled')}</p>
              </div>
              <button
                type="button"
                disabled={loading || saving}
                onClick={() => void toggle(key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? 'bg-accent-1' : 'bg-soft-tint/20'}`}
                aria-label={`${t('Settings.toggleAIAccess')} ${t(`Settings.${labelKey}`)}`}
                aria-pressed={enabled}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
