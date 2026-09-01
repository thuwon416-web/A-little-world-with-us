export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'
export type NotificationChannel = 'reminders' | 'messages' | 'milestones' | 'wellness'

export type NotificationSettings = {
  pushEnabled: boolean
  reminders: boolean
  messages: boolean
  milestones: boolean
  wellness: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  pushEnabled: false,
  reminders: true,
  messages: true,
  milestones: true,
  wellness: true,
}

export function supportsNotifications(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window
}

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return defaultNotificationSettings

  try {
    const stored = window.localStorage.getItem('a-little-world-with-us-notification-settings')
    if (!stored) {
      return defaultNotificationSettings
    }

    return {
      ...defaultNotificationSettings,
      ...JSON.parse(stored),
    }
  } catch {
    return defaultNotificationSettings
  }
}

export function updateNotificationSettings(nextSettings: Partial<NotificationSettings>) {
  if (typeof window === 'undefined') return defaultNotificationSettings

  const merged = {
    ...getNotificationSettings(),
    ...nextSettings,
  }

  window.localStorage.setItem('a-little-world-with-us-notification-settings', JSON.stringify(merged))
  return merged
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!supportsNotifications()) return 'unsupported'

  if (Notification.permission === 'granted') return 'granted'

  const permission = await Notification.requestPermission()
  const nextPermission = permission === 'granted' ? 'granted' : permission === 'denied' ? 'denied' : 'default'

  updateNotificationSettings({ pushEnabled: nextPermission === 'granted' })
  return nextPermission
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!supportsNotifications()) return 'unsupported'
  return Notification.permission === 'granted'
    ? 'granted'
    : Notification.permission === 'denied'
      ? 'denied'
      : 'default'
}

export function showBrowserNotification(title: string, options: NotificationOptions = {}) {
  if (!supportsNotifications() || Notification.permission !== 'granted') return null

  return new Notification(title, {
    silent: false,
    ...options,
  })
}

export function scheduleBrowserReminder(
  title: string,
  message: string,
  delayInMs = 1000,
  options: NotificationOptions = {},
) {
  if (typeof window === 'undefined') return null

  return window.setTimeout(() => {
    showBrowserNotification(title, {
      body: message,
      ...options,
    })
  }, delayInMs)
}
