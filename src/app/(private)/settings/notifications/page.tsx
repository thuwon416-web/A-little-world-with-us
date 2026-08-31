'use client'

import { useEffect, useState } from 'react'
import { Bell, Heart, MessageSquareText, Sparkles } from 'lucide-react'
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationChannel,
  type NotificationPermissionState,
  type NotificationSettings,
  getNotificationSettings,
  updateNotificationSettings,
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

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings())
  const [permission, setPermission] = useState<NotificationPermissionState>('unsupported')

  useEffect(() => {
    setPermission(getNotificationPermission())
    setSettings(getNotificationSettings())
  }, [])

  const handlePermissionRequest = async () => {
    const nextPermission = await requestNotificationPermission()
    setPermission(nextPermission)
    setSettings((current) => ({
      ...current,
      pushEnabled: nextPermission === 'granted',
    }))
  }

  const handleToggle = (key: NotificationChannel, enabled: boolean) => {
    const nextSettings = {
      ...settings,
      [key]: enabled,
    }

    setSettings(nextSettings)
    updateNotificationSettings(nextSettings)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Notifications</p>
        <h1 className="mt-3 text-3xl font-serif text-[var(--text-primary)]">Stay gently connected</h1>

        <div className="mt-5 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[var(--card-bg-strong)] p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Browser notifications</p>
            <p className="mt-1 text-lg font-medium text-[var(--text-primary)]">
              {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not enabled'}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePermissionRequest}
            className="rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
          >
            {permission === 'granted' ? 'Update permission' : 'Enable notifications'}
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-[var(--card-bg)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">What to notify me about</h2>
          <span className="rounded-full border border-white/10 bg-[var(--card-bg-strong)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {Object.values(settings).filter(Boolean).length - 1}/{toggleItems.length + 1}
          </span>
        </div>

        <div className="space-y-3">
          {toggleItems.map(({ key, label, description, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-[var(--card-bg-strong)] p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{label}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{description}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label={`Toggle ${label}`}
                onClick={() => handleToggle(key, !settings[key])}
                className={`relative h-7 w-12 rounded-full transition ${settings[key] ? 'bg-[var(--accent-1)]' : 'bg-white/10'}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${settings[key] ? 'left-6' : 'left-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
