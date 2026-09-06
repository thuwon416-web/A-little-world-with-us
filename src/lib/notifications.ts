export type NotificationChannel = 'reminders' | 'messages' | 'milestones' | 'wellness'
export type NotificationPermissionState = 'granted' | 'denied' | 'unsupported' | 'default'

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
