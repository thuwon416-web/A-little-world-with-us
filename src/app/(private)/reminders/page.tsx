'use client'

import { useState } from 'react'
import { Bell, Clock3, Plus, Sparkles } from 'lucide-react'
import { requestNotificationPermission, scheduleBrowserReminder } from '@/lib/notifications'

type Reminder = {
  id: number
  title: string
  time: string
  note: string
  enabled: boolean
}

const starterReminders: Reminder[] = [
  { id: 1, title: 'Daily check-in', time: '8:00 PM', note: 'A gentle prompt to reconnect.', enabled: true },
  { id: 2, title: 'Anniversary reminder', time: '9:00 AM', note: 'Celebrate the little moments.', enabled: true },
  { id: 3, title: 'Date night prep', time: 'Friday 6:30 PM', note: 'Start getting ready together.', enabled: false },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>(starterReminders)

  const handleToggle = (id: number) => {
    setReminders((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    )
  }

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission()
    if (permission === 'granted') {
      scheduleBrowserReminder('Reminder ready', 'Your love reminders are active.', 500)
    }
  }

  const addReminder = () => {
    setReminders((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: 'New reminder',
        time: 'Select time',
        note: 'Add a note for your next special moment.',
        enabled: true,
      },
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Reminders</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Gentle nudges</h1>
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)]"
        >
          <Bell className="h-4 w-4" /> Enable alerts
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Upcoming reminders</p>
            <button
              type="button"
              onClick={addReminder}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[var(--card-bg-strong)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-[22px] border border-white/10 bg-[var(--card-bg-strong)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{reminder.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{reminder.note}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(reminder.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      reminder.enabled
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-[var(--bg-2)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {reminder.enabled ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Clock3 className="h-4 w-4 text-[var(--accent-2)]" />
                  {reminder.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--accent-2)]/20 bg-[var(--card-bg)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Next trigger</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Tonight, 8:00 PM</p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[var(--card-bg)] p-5">
            <div className="flex items-center gap-3 text-[var(--accent-1)]">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Gentle pacing</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Reminders are designed to encourage connection without creating pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
