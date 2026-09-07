'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { requestNotificationPermission, scheduleReminder } from '@/lib/care-notifications'
import { Switch } from '@/components/ui/switch'

export default function SmartReminders() {
  const [loading, setLoading] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    pms: false, period: false, fertile: false, symptom: false,
  })

  useEffect(() => { loadReminders(); checkNotificationPermission() }, [])

  const checkNotificationPermission = () => {
    if ('Notification' in window) setPermissionGranted(Notification.permission === 'granted')
  }

  const loadReminders = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('care_reminders').select('*').eq('user_id', user.id)
      if (error) throw error

      const remindersMap: Record<string, boolean> = {}
      data?.forEach(reminder => { remindersMap[reminder.reminder_type] = reminder.enabled })
      setReminders({ pms: remindersMap.pms || false, period: remindersMap.period || false, fertile: remindersMap.fertile || false, symptom: remindersMap.symptom || false })
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally { setLoading(false) }
  }

  const handleToggle = async (type: 'pms' | 'period' | 'fertile' | 'symptom', enabled: boolean) => {
    try {
      if (enabled) {
        const granted = await requestNotificationPermission()
        if (!granted) { alert('Notification permission is required'); return }
        setPermissionGranted(true)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('care_reminders').upsert({
        user_id: user.id, reminder_type: type, enabled, updated_at: new Date().toISOString(),
      })
      if (error) throw error

      setReminders(prev => ({ ...prev, [type]: enabled }))
      if (enabled) await scheduleReminder(type)
    } catch (error) {
      console.error('Error toggling reminder:', error)
      alert('Failed to update reminder')
    }
  }

  if (loading) return <div className="flex items-center justify-center p-4"><div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--accent-2)]" /></div>

  return (
    <div className="glass-card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Smart Reminders</h3>
        {!permissionGranted && <span className="text-xs text-[var(--accent-2)]">🔔 Notification permission required</span>}
      </div>

      <div className="space-y-3">
        {[
          { key: 'pms' as const, title: 'PMS Reminder', desc: '5-7 days before your period' },
          { key: 'period' as const, title: 'Period Reminder', desc: '1 day before expected period' },
          { key: 'fertile' as const, title: 'Fertile Day Alert', desc: 'During your fertile window' },
          { key: 'symptom' as const, title: 'Symptom Check-in', desc: 'Daily reminder to log symptoms' },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-3">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.desc}</p>
            </div>
            <Switch checked={reminders[item.key]} onCheckedChange={(checked) => handleToggle(item.key, checked)} />
          </div>
        ))}
      </div>

      {!permissionGranted && (
        <button
          type="button"
          onClick={async () => { const granted = await requestNotificationPermission(); setPermissionGranted(granted) }}
          className="glass-button w-full rounded-lg py-2 text-sm text-white transition hover:brightness-110"
        >
          🔔 Enable Notifications
        </button>
      )}
    </div>
  )
}
