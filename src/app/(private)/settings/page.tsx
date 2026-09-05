'use client'

import { BellRing, NotebookPen, ShieldCheck, Wand2 } from 'lucide-react'
import { useState } from 'react'
import dynamic from 'next/dynamic'

import ErrorReport from '@/components/shared/ErrorReport'
import PWAInstall from '@/components/shared/PWAInstall'
import ThemeToggle from '@/components/shared/ThemeToggle'
import ExportData from '@/features/care/ExportData'
import MoodChart from '@/features/care/MoodChart'

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [quietMode, setQuietMode] = useState(false)
  const [privateMode, setPrivateMode] = useState(true)

  return (
    <main className="space-y-6 p-4 md:p-6 animate-fade-in">
      <section className="rounded-[32px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_42px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Settings</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Your little world</h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Preferences</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">App settings</h2>
            </div>
            <PWAInstall />
          </div>

          <div className="space-y-3">
            {[
              { label: 'Push notifications', value: notificationsEnabled, onChange: setNotificationsEnabled },
              { label: 'Quiet mode', value: quietMode, onChange: setQuietMode },
              { label: 'Private home mode', value: privateMode, onChange: setPrivateMode },
            ].map(({ label, value, onChange }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-[var(--card-bg-strong)] p-4"
              >
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{label}</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {value ? 'Enabled' : 'Disabled'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onChange(!value)}
                  className={`relative h-7 w-12 rounded-full transition ${value ? 'bg-[var(--accent-1)]' : 'bg-white/10'}`}
                  aria-label={`Toggle ${label}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${value ? 'left-6' : 'left-1'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5 rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Theme</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Atmosphere</h2>
          </div>

          <ThemeToggle />
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {settingCards.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Account</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Manage your couple space</h2>

        <div className="mt-4 space-y-4">
          <CoupleSettings />
          <HealthProfileWidget />
          <FavoritesWidget />
          <RemindersWidget />
          <PINLockWidget />
          <SecuritySettings />
          <LanguageSwitcher />
          <TwoFactorAuthWidget />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Care Data</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Your wellness information</h2>

        <div className="mt-4 space-y-4">
          <MoodChart />
          <ExportData />
        </div>
      </section>

      <ErrorReport />
    </main>
  )
}
