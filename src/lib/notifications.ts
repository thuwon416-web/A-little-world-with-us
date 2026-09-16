import { supabase } from '@/lib/supabase'

export type NotificationChannel = 'reminders' | 'messages' | 'milestones' | 'wellness'
export type NotificationPermissionState = 'granted' | 'denied' | 'unsupported' | 'default'
export type SafetyNotificationPreference = 'geofence' | 'battery_low' | 'missed_checkin'
export type SafetyNotificationPreferences = Record<SafetyNotificationPreference, boolean>

export interface NotificationSettings {
  reminders: boolean
  messages: boolean
  milestones: boolean
  wellness: boolean
  pushEnabled: boolean
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  return Notification.permission as NotificationPermissionState
}

export function sendNotification(title: string, body?: string) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  new Notification(title, {
    body,
    icon: '/icon-192x192.png',
  })
}

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') {
    return {
      reminders: true,
      messages: true,
      milestones: true,
      wellness: true,
      pushEnabled: false,
    }
  }

  const stored = localStorage.getItem('notificationSettings')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {
        reminders: true,
        messages: true,
        milestones: true,
        wellness: true,
        pushEnabled: false,
      }
    }
  }

  return {
    reminders: true,
    messages: true,
    milestones: true,
    wellness: true,
    pushEnabled: false,
  }
}

export function updateNotificationSettings(settings: Partial<NotificationSettings>) {
  const current = getNotificationSettings()
  const updated = { ...current, ...settings }
  localStorage.setItem('notificationSettings', JSON.stringify(updated))
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
    const defaults: SafetyNotificationPreferences = { geofence: true, battery_low: true, missed_checkin: true }
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

export async function hasRegisteredPushDevice(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { count } = await supabase
    .from('push_devices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (count ?? 0) > 0
}

export function scheduleBrowserReminder(title: string, time: string, delay?: number) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  // If delay is provided, use it directly
  if (delay !== undefined) {
    setTimeout(() => {
      sendNotification(title, time)
    }, delay)
    return
  }

  // Basic implementation - in a real app, you'd use more sophisticated scheduling
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hours, minutes, 0, 0)

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const delayMs = scheduledTime.getTime() - now.getTime()

  setTimeout(() => {
    sendNotification(title, 'Reminder from your little world')
  }, delayMs)
}

export function scheduleNotification(title: string, body?: string, delayMs: number = 5000) {
  setTimeout(() => {
    sendNotification(title, body)
  }, delayMs)
}

export async function sendScheduledNotification(userId: string, title: string, body?: string, scheduledAt?: string) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        body,
        scheduledAt,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('Scheduled notification error:', error)
    return { error: 'Failed to schedule notification' }
  }
}
