'use client'

import { BellRing, NotebookPen, ShieldCheck, Wand2 } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'

import ErrorReport from '@/components/shared/ErrorReport'
import FeedbackWidget from '@/components/FeedbackWidget'
import PWAInstall from '@/components/shared/PWAInstall'
import ThemeToggle from '@/components/shared/ThemeToggle'
import NotificationPermission from '@/components/NotificationPermission'
import ExportData from '@/features/care/ExportData'
import MoodChart from '@/features/care/MoodChart'
import AIPrivacySettings from '@/features/settings/AIPrivacySettings'
import ChatHistoryExport from '@/features/chat/ChatHistoryExport'
import FinanceExport from '@/features/settings/FinanceExport'
import PhotoExportSettings from '@/features/settings/PhotoExportSettings'

const CoupleSettings = dynamic(() => import('@/features/settings/CoupleSettings'), {
  ssr: false,
})

const HealthProfileWidget = dynamic(() => import('@/features/settings/HealthProfileWidget'), {
  ssr: false,
})

const FavoritesWidget = dynamic(() => import('@/features/settings/FavoritesWidget'), {
  ssr: false,
})

const RemindersWidget = dynamic(() => import('@/features/settings/RemindersWidget'), {
  ssr: false,
})

const PINLockWidget = dynamic(() => import('@/features/settings/PINLockWidget'), {
  ssr: false,
})

const SecuritySettings = dynamic(() => import('@/features/settings/SecuritySettings'), {
  ssr: false,
})

const LanguageSwitcher = dynamic(() => import('@/features/settings/LanguageSwitcher'), {
  ssr: false,
})

const TwoFactorAuthWidget = dynamic(() => import('@/features/settings/TwoFactorAuthWidget'), {
  ssr: false,
})

const settingCards = [
  { icon: BellRing, title: 'Notices', description: 'Daily reminders and gentle nudges' },
  { icon: NotebookPen, title: 'Rituals', description: 'Saved habits and shared memories' },
  { icon: ShieldCheck, title: 'Privacy', description: 'Private couple space protection' },
  { icon: Wand2, title: 'Theme', description: 'Aesthetic atmosphere for your home' },
]

export default function SettingsPage() {
  const [activeSettingsModal, setActiveSettingsModal] = useState<'reminder' | 'pin' | null>(null)

  return (
    <div className="space-y-6 p-4 md:p-6 animate-fade-in">
      <section className="rounded-[32px] border border-accent-1/20 bg-card p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">Settings</p>
        <h1 className="mt-3 text-3xl font-serif text-text-1">Your little world</h1>
      </section>

      <NotificationPermission />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-modal border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-2">Preferences</p>
              <h2 className="mt-1 text-xl font-semibold text-text-1">App settings</h2>
            </div>
            <PWAInstall />
          </div>

          <AIPrivacySettings />
        </section>

        <aside className="space-y-5 rounded-modal border border-border bg-card p-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-2">Theme</p>
            <h2 className="mt-1 text-xl font-semibold text-text-1">Atmosphere</h2>
          </div>

          <ThemeToggle />
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settingCards.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-[24px] border border-border bg-card p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text-1">{title}</h3>
            <p className="mt-2 text-sm text-text-2">{description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-modal border border-border bg-card p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-text-2">Account</p>
        <h2 className="mt-1 text-xl font-semibold text-text-1">Manage your couple space</h2>

        <div className="mt-4 space-y-4">
          <CoupleSettings />
          <HealthProfileWidget />
          <FavoritesWidget />
          <RemindersWidget
            modalBlocked={activeSettingsModal !== null && activeSettingsModal !== 'reminder'}
            onModalOpen={() => setActiveSettingsModal('reminder')}
            onModalClose={() => setActiveSettingsModal(null)}
          />
          <PINLockWidget
            modalBlocked={activeSettingsModal !== null && activeSettingsModal !== 'pin'}
            onModalOpen={() => setActiveSettingsModal('pin')}
            onModalClose={() => setActiveSettingsModal(null)}
          />
          <SecuritySettings />
          <LanguageSwitcher />
          <TwoFactorAuthWidget />
        </div>
      </section>

      <section className="rounded-modal border border-border bg-card p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-text-2">Data & Export</p>
        <h2 className="mt-1 text-xl font-semibold text-text-1">Your data, in one place</h2>

        <div className="mt-4 space-y-4">
          <MoodChart />
          <ExportData />
          <ChatHistoryExport />
          <FinanceExport />
          <PhotoExportSettings />
        </div>
      </section>

      <ErrorReport />
      <FeedbackWidget />
    </div>
  )
}
