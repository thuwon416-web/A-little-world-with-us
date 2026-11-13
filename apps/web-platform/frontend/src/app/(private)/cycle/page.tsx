'use client'

import CareRhythmBoard from '@/features/cycle/CareRhythmBoard'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CyclePage() {
  const { t } = useLanguage()
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-serif mb-6 text-center">{t('Care.privateCare')}</h1>
      <CareRhythmBoard />
    </div>
  )
}
