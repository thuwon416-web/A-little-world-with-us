import * as Notifications from 'expo-notifications'
import { useEffect, useState } from 'react'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import {
  registerForPushNotifications,
  scheduleReminder,
  sendLocalNotification,
  syncLocalReminderNotifications,
  type Reminder,
} from '@/services/notifications'

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const result = await Notifications.getPermissionsAsync()
      setPermissionStatus(result.status)

      const nextToken = await registerForPushNotifications()
      const updatedPermission = await Notifications.getPermissionsAsync()
      setPermissionStatus(updatedPermission.status)
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
            setCoupleId(link.couple_id)
            const { data, error } = await supabase
              .from('reminders')
              .select('*')
              .eq('couple_id', link.couple_id)
              .order('scheduled_at', { ascending: true })
            if (error) throw error
            const savedReminders = (data ?? []) as Reminder[]
            setReminders(savedReminders)
            try {
              await syncLocalReminderNotifications(savedReminders)
            } catch {
              setError(
                'Unable to schedule reminders on this device. Check notification permissions.'
              )
            }
          } else {
            await syncLocalReminderNotifications([])
          }
        } else {
          await syncLocalReminderNotifications([])
        }
      } else {
        await syncLocalReminderNotifications([])
      }
    }

    void load().catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Unable to load reminders.')
    })
  }, [])

  useEffect(() => {
    if (!coupleId || !isSupabaseConfigured) return
    let active = true
    const refresh = async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('couple_id', coupleId)
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      const savedReminders = (data ?? []) as Reminder[]
      if (!active) return
      setReminders(savedReminders)
      try {
        await syncLocalReminderNotifications(savedReminders)
        setError('')
      } catch {
        setError('Unable to schedule reminders on this device. Check notification permissions.')
      }
    }
    const channel = supabase
      .channel(`local-reminders-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reminders',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void refresh().catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : 'Unable to refresh reminders.')
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void refresh().catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : 'Unable to refresh reminders.')
          })
        }
      })
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const addReminder = async (title: string, message: string, scheduledAt: string) => {
    setError('')
    const saved = await scheduleReminder({
      title,
      message,
      scheduled_at: scheduledAt,
      repeat: 'none',
      active: true,
    })

    if (!saved) {
      setError('Unable to save the reminder. Check your account and network connection.')
      return false
    }
    const updated = [...reminders, saved]
    setReminders(updated)
    try {
      await syncLocalReminderNotifications(updated)
    } catch {
      setError(
        'The reminder was saved, but device notifications could not be scheduled. Check permissions.'
      )
    }
    return true
  }

  const triggerTest = async () => {
    await sendLocalNotification('Love reminder', 'This is a quick test from your little world.')
  }

  return {
    permissionStatus,
    reminders,
    token,
    error,
    addReminder,
    triggerTest,
  }
}
