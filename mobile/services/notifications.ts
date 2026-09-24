import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type SafetyNotificationPreference = 'geofence' | 'battery_low' | 'missed_checkin'
export type SafetyNotificationPreferences = Record<SafetyNotificationPreference, boolean>

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
  couple_id?: string | null
}

async function getAcceptedCoupleId(userId: string) {
  const { data } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .eq('status', 'accepted')
    .not('couple_id', 'is', null)
    .maybeSingle()
  return data?.couple_id ?? null
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (isSupabaseConfigured && user && (Platform.OS === 'android' || Platform.OS === 'ios')) {
    await supabase.from('push_devices').upsert(
      {
        user_id: user.id,
        expo_push_token: token,
        platform: Platform.OS,
        device_id: Device.modelId ?? Device.deviceName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'expo_push_token' }
    )
  }
  return token
}

export async function updateSafetyNotificationPreference(
  key: SafetyNotificationPreference,
  enabled: boolean
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to update notification preferences.')
  const { data: devices, error: devicesError } = await supabase
    .from('push_devices')
    .select('id,preferences')
    .eq('user_id', user.id)
  if (devicesError) throw new Error(devicesError.message)
  for (const device of devices ?? []) {
    const { error } = await supabase
      .from('push_devices')
      .update({ preferences: { ...(device.preferences ?? {}), [key]: enabled } })
      .eq('id', device.id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  }
}

export async function getSafetyNotificationPreferences(): Promise<SafetyNotificationPreferences> {
  const defaults: SafetyNotificationPreferences = {
    geofence: true,
    battery_low: true,
    missed_checkin: true,
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return defaults
  const { data, error } = await supabase
    .from('push_devices')
    .select('preferences')
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
  for (const device of data ?? []) {
    for (const key of Object.keys(defaults) as SafetyNotificationPreference[]) {
      if (device.preferences?.[key] !== undefined) defaults[key] = device.preferences[key] !== false
    }
  }
  return defaults
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
    couple_id: await getAcceptedCoupleId(reminder.user_id ?? user.id),
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

/** Keep this device's OS notifications aligned with the couple's saved reminders. */
export async function syncLocalReminderNotifications(reminders: Reminder[]) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    })
  }

  const now = Date.now()
  const pending = new Map(
    reminders
      .filter((reminder) => reminder.active && new Date(reminder.scheduled_at).getTime() > now)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
      .slice(0, 60)
      .map((reminder) => [reminder.id, reminder] as const)
  )

  const existing = await Notifications.getAllScheduledNotificationsAsync()
  for (const notification of existing) {
    const data = notification.content.data as
      { reminderId?: string; scheduledAt?: string } | undefined
    if (!data?.reminderId) continue

    const reminder = pending.get(data.reminderId)
    const isCurrent =
      reminder &&
      data.scheduledAt === reminder.scheduled_at &&
      notification.content.title === reminder.title &&
      notification.content.body === reminder.message
    if (isCurrent) pending.delete(reminder.id)
    else await Notifications.cancelScheduledNotificationAsync(notification.identifier)
  }

  for (const reminder of pending.values()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.message,
        sound: 'default',
        data: { reminderId: reminder.id, scheduledAt: reminder.scheduled_at },
        ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
      },
      trigger: new Date(reminder.scheduled_at),
    })
  }
}
