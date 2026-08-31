import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export type Reminder = {
  id: string
  user_id: string
  title: string
  message: string
  scheduled_at: string
  repeat: 'none' | 'daily' | 'weekly'
  active: boolean
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    return null
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export async function scheduleReminder(
  reminder: Omit<Reminder, 'id' | 'user_id'> & { user_id?: string }
) {
  if (!isSupabaseConfigured) {
    return null
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const payload = {
    id: crypto.randomUUID(),
    user_id: reminder.user_id ?? user.id,
    title: reminder.title,
    message: reminder.message,
    scheduled_at: reminder.scheduled_at,
    repeat: reminder.repeat ?? 'none',
    active: reminder.active ?? true,
  }

  const { data, error } = await supabase.from('reminders').insert(payload).select().single()
  return error ? null : (data as Reminder | null)
}

export async function cancelReminder(reminderId: string) {
  if (!isSupabaseConfigured) {
    return false
  }

  const { error } = await supabase.from('reminders').delete().eq('id', reminderId)
  return !error
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null,
  })
}
