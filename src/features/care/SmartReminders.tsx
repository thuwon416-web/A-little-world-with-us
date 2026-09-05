'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { requestNotificationPermission, scheduleReminder } from '@/lib/care-notifications'
import { Switch } from '@/components/ui/switch'

export default function SmartReminders() {
  const [loading, setLoading] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    pms: false,
    period: false,
    fertile: false,
    symptom: false,
  })

  useEffect(() => {
    loadReminders()
    checkNotificationPermission()
  }, [])

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }

  const loadReminders = async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('care_reminders')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      const remindersMap: Record<string, boolean> = {}
      data?.forEach(reminder => {
        remindersMap[reminder.reminder_type] = reminder.enabled
      })

      setReminders({
        pms: remindersMap.pms || false,
        period: remindersMap.period || false,
        fertile: remindersMap.fertile || false,
        symptom: remindersMap.symptom || false,
      })

    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (type: 'pms' | 'period' | 'fertile' | 'symptom', enabled: boolean) => {
    try {
      // Request notification permission if enabling
      if (enabled) {
        const granted = await requestNotificationPermission()
        if (!granted) {
          alert('Notification permission is required to enable reminders')
          return
        }
        setPermissionGranted(true)
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert reminder
      const reminderData = {
        user_id: user.id,
        reminder_type: type,
        enabled,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('care_reminders')
        .upsert(reminderData)

      if (error) throw error

      // Update local state
      setReminders(prev => ({
        ...prev,
        [type]: enabled,
      }))

      // Schedule notification if enabling
      if (enabled) {
        await scheduleReminder(type)
      }

    } catch (error) {
      console.error('Error toggling reminder:', error)
      alert('Failed to update reminder. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white/10 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Smart Reminders</h3>
        {!permissionGranted && (
          <span className="text-xs text-yellow-400">
            🔔 Notification permission required
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* PMS Reminder */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <div>
            <p className="font-medium">PMS Reminder</p>
            <p className="text-xs text-gray-400">5-7 days before your period</p>
          </div>
          <Switch
            checked={reminders.pms}
            onCheckedChange={(checked) => handleToggle('pms', checked)}
          />
        </div>

        {/* Period Reminder */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <div>
            <p className="font-medium">Period Reminder</p>
            <p className="text-xs text-gray-400">1 day before expected period</p>
          </div>
          <Switch
            checked={reminders.period}
            onCheckedChange={(checked) => handleToggle('period', checked)}
          />
        </div>

        {/* Fertile Day Alert */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <div>
            <p className="font-medium">Fertile Day Alert</p>
            <p className="text-xs text-gray-400">During your fertile window</p>
          </div>
          <Switch
            checked={reminders.fertile}
            onCheckedChange={(checked) => handleToggle('fertile', checked)}
          />
        </div>

        {/* Symptom Check-in */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <div>
            <p className="font-medium">Symptom Check-in</p>
            <p className="text-xs text-gray-400">Daily reminder to log symptoms</p>
          </div>
          <Switch
            checked={reminders.symptom}
            onCheckedChange={(checked) => handleToggle('symptom', checked)}
          />
        </div>
      </div>

      {!permissionGranted && (
        <button
          type="button"
          onClick={async () => {
            const granted = await requestNotificationPermission()
            setPermissionGranted(granted)
          }}
          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm transition"
        >
          🔔 Enable Notifications
        </button>
      )}
    </div>
  )
}
