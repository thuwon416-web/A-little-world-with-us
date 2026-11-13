'use client'

import { Shield, Key, Lock, Eye } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SecuritySettings() {
  const { t } = useLanguage()
  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-semibold text-text-1 mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-accent-1" />
        {t('Settings.security')}
      </h3>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-accent-1 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-1">
              {t('Settings.securityHeaders')}
            </p>
            <p className="text-xs text-text-2 mt-1">
              {t('Settings.securityHeadersDescription')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Key className="h-5 w-5 text-accent-1 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-1">
              {t('Settings.rlsPolicies')}
            </p>
            <p className="text-xs text-text-2 mt-1">
              {t('Settings.rlsDescription')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Eye className="h-5 w-5 text-accent-1 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-1">
              {t('Settings.clientEncryption')}
            </p>
            <p className="text-xs text-text-2 mt-1">
              {t('Settings.clientEncryptionDescription')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-accent-1 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-1">
              {t('Settings.pinProtection')}
            </p>
            <p className="text-xs text-text-2 mt-1">
              {t('Settings.pinProtectionDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
