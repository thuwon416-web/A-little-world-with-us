'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Bell, Heart, MessageSquareText, Sparkles } from 'lucide-react'
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationChannel,
  type NotificationPermissionState,
  type NotificationSettings,
  getNotificationSettings,
  updateNotificationSettings,
  updateSafetyNotificationPreference,
  getSafetyNotificationPreferences,
  hasRegisteredPushDevice,
  type SafetyNotificationPreference,
} from '@/lib/notifications'

const toggleItems: Array<{
  key: NotificationChannel
  label: string
  description: string
  icon: typeof Bell
}> = [
  { key: 'reminders', label: 'Reminders', description: 'Gentle nudges for dates and rituals.', icon: Bell },
  { key: 'messages', label: 'Messages', description: 'New chat and reply alerts.', icon: MessageSquareText },
  { key: 'milestones', label: 'Milestones', description: 'Anniversaries and special moments.', icon: Sparkles },
  { key: 'wellness', label: 'Wellness', description: 'Daily check-ins and care prompts.', icon: Heart },
]
const safetyToggleItems: Array<{ key: SafetyNotificationPreference; label: string; description: string }> = [
  { key: 'geofence', label: 'Saved-place arrival / departure', description: 'Notify when your partner enters or leaves a saved place.' },
  { key: 'battery_low', label: 'Partner battery low', description: 'Notify when your partner’s device battery is low.' },
  { key: 'missed_checkin', label: 'Partner missed check-in', description: 'Notify when an expected safety check-in expires.' },
]

export default function NotificationSettingsPage() {
  const { t } = useLanguage()
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings())
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported')
  const [safetyPreferences, setSafetyPreferences] = useState<Record<SafetyNotificationPreference, boolean>>({
    geofence: true,
    battery_low: true,
    missed_checkin: true,
  })
  const [hasPushDevice, setHasPushDevice] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setPermission(getNotificationPermission())
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null
      setUserId(id)
      if (id) setSettings(getNotificationSettings(id))
    })
    void getSafetyNotificationPreferences().then(setSafetyPreferences).catch(() => undefined)
    void hasRegisteredPushDevice().then(setHasPushDevice).catch(() => setHasPushDevice(false))
  }, [])

  const handlePermissionRequest = async () => {
    const granted = await requestNotificationPermission()
    setPermission(granted ? 'granted' : 'denied')
    setSettings((current) => ({
      ...current,
      pushEnabled: granted,
    }))
  }

  const handleToggle = (key: NotificationChannel, enabled: boolean) => {
    const nextSettings = {
      ...settings,
      [key]: enabled,
    }

    setSettings(nextSettings)
    if (userId) updateNotificationSettings(userId, nextSettings)
  }

  const handleSafetyToggle = async (key: SafetyNotificationPreference, enabled: boolean) => {
    setSafetyPreferences((current) => ({ ...current, [key]: enabled }))
    try {
      await updateSafetyNotificationPreference(key, enabled)
    } catch (error) {
      setSafetyPreferences((current) => ({ ...current, [key]: !enabled }))
      alert(error instanceof Error ? error.message : t('Notifications.saveError'))
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-panel border border-accent-1/20 bg-card p-6 shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">{t('Notifications.title')}</p>
        <h1 className="mt-3 text-3xl font-serif text-text-1">{t('Notifications.stayConnected')}</h1>

        <div className="mt-5 flex flex-col gap-4 rounded-card border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-text-2">{t('Notifications.browser')}</p>
            <p className="mt-1 text-lg font-medium text-text-1">
              {permission === 'granted' ? t('Notifications.enabled') : permission === 'denied' ? t('Notifications.blocked') : t('Notifications.notEnabled')}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePermissionRequest}
            className="min-h-11 rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white font-semibold shadow-sm"
          >
            {permission === 'granted' ? t('Notifications.updatePermission') : t('Notifications.enable')}
          </button>
        </div>
      </div>

      <div className="rounded-modal border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-1">{t('Notifications.whatToNotify')}</h2>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs uppercase tracking-[0.16em] text-text-2">
            {Object.values(settings).filter(Boolean).length - 1}/{toggleItems.length + 1}
          </span>
        </div>

        <div className="space-y-3">
          {toggleItems.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-card border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-2/10 text-accent-2">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-text-1">{t(`Notifications.channels.${key}`)}</p>
                  <p className="text-sm text-text-2">{t(`Notifications.channels.${key}Description`)}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label={`${t('Notifications.toggle')} ${t(`Notifications.channels.${key}`)}`}
                onClick={() => handleToggle(key, !settings[key])}
                className={`relative min-h-11 min-w-12 rounded-full transition ${settings[key] ? 'bg-accent-1' : 'bg-border/30'}`}
              >
                <span
                  className={`absolute top-3 h-5 w-5 rounded-full bg-white transition ${settings[key] ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-modal border border-border bg-card p-5">
        <h2 className="mb-4 text-xl font-semibold text-text-1">{t('Notifications.safety')}</h2>
        <div className="space-y-3">
          {safetyToggleItems.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-[22px] border border-border bg-card p-4">
              <div>
                <p className="font-medium text-text-1">{t(`Notifications.safetyChannels.${key}`)}</p>
                <p className="text-sm text-text-2">{t(`Notifications.safetyChannels.${key}Description`)}</p>
              </div>
              <button
                type="button"
                aria-label={`${t('Notifications.toggle')} ${t(`Notifications.safetyChannels.${key}`)}`}
                disabled={hasPushDevice !== true}
                onClick={() => {
                  if (hasPushDevice === true) void handleSafetyToggle(key, !safetyPreferences[key])
                }}
                className={`relative min-h-11 min-w-12 rounded-full transition ${safetyPreferences[key] ? 'bg-accent-1' : 'bg-card/10'} ${hasPushDevice !== true ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className={`absolute top-3 h-5 w-5 rounded-full bg-text-1 transition ${safetyPreferences[key] ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
        {hasPushDevice === null ? (
          <p className="mt-4 text-sm text-text-2">{t('Notifications.checkingPush')}</p>
        ) : hasPushDevice === false ? (
          <p className="mt-4 text-sm text-text-2">
            {t('Notifications.enablePush')}
          </p>
        ) : null}
      </div>
    </div>
  )
}
