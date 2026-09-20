'use client'

import { useEffect, useState } from 'react'
import { Clock3, Plus, Sparkles } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { requestNotificationPermission, scheduleBrowserReminder } from '@/lib/notifications'
import { getCoupleStatus } from '@/lib/couples'
import { getCurrentUserId, supabase } from '@/lib/supabase'

type Reminder = {
  id: string
  title: string
  scheduled_at: string
  message: string
  enabled: boolean
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  const loadReminders = async (activeCoupleId: string) => {
    const { data } = await supabase.from('reminders').select('id,title,message,scheduled_at,active').eq('couple_id', activeCoupleId).order('scheduled_at', { ascending: true })
    setReminders((data ?? []).map((item) => ({ id: item.id, title: item.title, message: item.message ?? '', scheduled_at: item.scheduled_at, enabled: item.active })))
  }

  useEffect(() => {
    void Promise.all([getCurrentUserId(), getCoupleStatus()]).then(([id, status]) => {
      const activeCoupleId = status.status === 'accepted' ? status.couple?.id ?? null : null
      setUserId(id); setCoupleId(activeCoupleId)
      if (activeCoupleId) void loadReminders(activeCoupleId)
    })
  }, [])

  const handleToggle = async (reminder: Reminder) => {
    const { error } = await supabase.from('reminders').update({ active: !reminder.enabled }).eq('id', reminder.id)
    if (!error && coupleId) await loadReminders(coupleId)
  }

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      scheduleBrowserReminder('Reminder ready', 'Your love reminders are active.', 500)
    }
  }

  const addReminder = async () => {
    if (!title.trim() || !scheduledAt || !coupleId || !userId) return
    const { error } = await supabase.from('reminders').insert({ user_id: userId, couple_id: coupleId, title: title.trim(), message: message.trim(), scheduled_at: new Date(scheduledAt).toISOString(), active: true })
    if (!error) { setTitle(''); setMessage(''); setScheduledAt(''); await loadReminders(coupleId) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-2">Reminders</p>
          <h1 className="mt-2 text-3xl font-serif text-text-1">Gentle nudges</h1>
        </div>
        <button
          type="button"
          onClick={enableNotifications}
          className="inline-flex items-center gap-2 rounded-full bg-accent-1 px-4 py-2 text-sm font-medium text-white"
        >
          <AnimatedIcon name="Bell" animation="wiggle" trigger="hover" size={16} /> Enable alerts
        </button>
      </div>

      {!coupleId && <p className="rounded-btn border border-warning/30 bg-warning/10 p-4 text-sm text-warning">Accept a couple link to create reminders shared by both accounts.</p>}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-modal border border-accent-1/20 bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-text-2">Upcoming reminders</p>
            <button
              type="button"
              onClick={() => void addReminder()}
              disabled={!coupleId}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-text-1"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reminder title" className="rounded-xl border border-border bg-soft-tint px-3 py-2 text-sm text-text-1" />
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="A short note" className="rounded-xl border border-border bg-soft-tint px-3 py-2 text-sm text-text-1" />
            <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="rounded-xl border border-border bg-soft-tint px-3 py-2 text-sm text-text-1" />
          </div>

          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-[22px] border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-text-1">{reminder.title}</p>
                    <p className="mt-1 text-sm text-text-2">{reminder.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggle(reminder)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      reminder.enabled
                        ? 'bg-success/15 text-success'
                        : 'bg-soft-tint text-text-2'
                    }`}
                  >
                    {reminder.enabled ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-text-2">
                  <Clock3 className="h-4 w-4 text-accent-2" />
                  {new Date(reminder.scheduled_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-accent-2/20 bg-card p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-text-2">Next trigger</p>
            <p className="mt-2 text-2xl font-semibold text-text-1">Tonight, 8:00 PM</p>
          </div>

          <div className="rounded-[24px] border border-border bg-card p-5">
            <div className="flex items-center gap-3 text-accent-1">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Gentle pacing</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-2">
              Reminders are designed to encourage connection without creating pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
