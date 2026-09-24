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

export type BrowserPushSetupResult = 'enabled' | 'denied' | 'unsupported'

function decodeVapidKey(base64Key: string) {
  const padding = '='.repeat((4 - (base64Key.length % 4)) % 4)
  const base64 = `${base64Key}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

/** Register this browser's worker, then save the subscription to the signed-in account. */
export async function registerBrowserPushSubscription(): Promise<BrowserPushSetupResult> {
  if (
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return 'unsupported'
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const keyResponse = await fetch('/api/notifications/push-key', { cache: 'no-store' })
  if (!keyResponse.ok) throw new Error('ဆာဗာတွင် ဝဘ်အသိပေးချက်ကို မပြင်ဆင်ရသေးပါ။')
  const { publicKey } = (await keyResponse.json()) as { publicKey: string }
  if (!publicKey) throw new Error('အများသုံးသော့ မရှိပါ။')

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeVapidKey(publicKey),
    }))

  const saveResponse = await fetch('/api/notifications/push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription.toJSON()),
  })
  if (saveResponse.status === 401) throw new Error('အကောင့်ဝင်ပြီးမှ အသိပေးချက်ဖွင့်ပါ။')
  if (!saveResponse.ok) throw new Error('ဒီဘရောက်ဇာကို မှတ်ပုံတင်မရပါ။')
  return 'enabled'
}

/** Stop browser delivery before signing out so another local account cannot inherit it. */
export async function removeBrowserPushSubscription() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  try {
    await fetch('/api/notifications/push-subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  } finally {
    await subscription.unsubscribe()
  }
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
