import { useEffect, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications, scheduleReminder, sendLocalNotification, type Reminder } from '@/services/notifications'

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const result = await Notifications.getPermissionsAsync()
      setPermissionStatus(result.status)

      const nextToken = await registerForPushNotifications()
      if (nextToken) {
        setToken(nextToken)
      }
    }

    void load()
  }, [])

  const addReminder = async (title: string, message: string, scheduledAt: string) => {
    const saved = await scheduleReminder({
      title,
      message,
      scheduled_at: scheduledAt,
      repeat: 'none',
      active: true,
    })

    if (saved) {
      setReminders((current) => [...current, saved])
    }
  }

  const triggerTest = async () => {
    await sendLocalNotification('Love reminder', 'This is a quick test from your little world.')
  }

  return {
    permissionStatus,
    reminders,
    token,
    addReminder,
    triggerTest,
  }
}
