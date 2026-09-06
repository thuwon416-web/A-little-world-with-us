import * as Notifications from 'expo-notifications'
import { useEffect, useState } from 'react'

import {
  registerForPushNotifications,
  scheduleReminder,
  sendLocalNotification,
  type Reminder,
} from '@/services/notifications'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

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

      if (isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (user) {
          const { data: link } = await supabase
            .from('couple_links')
            .select('couple_id')
            .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
            .eq('status', 'accepted')
            .not('couple_id', 'is', null)
            .maybeSingle()
          if (link?.couple_id) {
            const { data } = await supabase.from('reminders').select('*').eq('couple_id', link.couple_id).order('scheduled_at', { ascending: true })
            setReminders((data ?? []) as Reminder[])
          }
        }
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
