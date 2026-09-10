'use client'

import { useState } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { useAIGuardian } from '@/features/ai-guardian/useAIGuardian'
import type { AIPrivacySettings } from '@/features/ai-guardian/contexts/privacy-context'

const privacyOptions: Array<{
  key: keyof AIPrivacySettings
  label: string
  description: string
}> = [
  { key: 'allow_ai_read_mood', label: 'Mood', description: 'Allow Guardian to use mood check-ins.' },
  { key: 'allow_ai_read_cycle', label: 'Cycle / wellness', description: 'Allow Guardian to use cycle and wellness data.' },
  { key: 'allow_ai_read_chat', label: 'Chat messages', description: 'Allow Guardian to use conversation history.' },
  { key: 'allow_ai_read_location', label: 'Location', description: 'Allow Guardian to use location context.' },
  { key: 'allow_ai_read_finance', label: 'Finance', description: 'Allow Guardian to use finance context.' },
]

export default function AIPrivacySettings() {
  const { privacy, loading, error, updatePrivacy } = useAIGuardian()
  const [savingKey, setSavingKey] = useState<keyof AIPrivacySettings | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggle = async (key: keyof AIPrivacySettings) => {
    setSavingKey(key)
    setSaveError(null)
    try {
      await updatePrivacy({ [key]: !privacy[key] })
    } catch (caughtError) {
      setSaveError(caughtError instanceof Error ? caughtError.message : 'Could not save privacy setting.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section className="space-y-4 rounded-[22px] border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--accent-2)]" />
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">AI Guardian privacy</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Choose which personal information Guardian may use. All permissions are off by default.
          </p>
        </div>
      </div>

      {(error || saveError) && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{saveError || error}</p>
        </div>
      )}

      <div className="space-y-3">
        {privacyOptions.map(({ key, label, description }) => {
          const enabled = privacy[key]
          const saving = savingKey === key
          return (
            <div key={key} className="flex items-center justify-between gap-4 rounded-[18px] border border-white/10 p-3">
              <div>
                <p className="font-medium text-[var(--text-primary)]">{label}</p>
                <p className="text-sm text-[var(--text-secondary)]">{description}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <button
                type="button"
                disabled={loading || saving}
                onClick={() => void toggle(key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? 'bg-[var(--accent-1)]' : 'bg-white/10'}`}
                aria-label={`Toggle AI access to ${label}`}
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
