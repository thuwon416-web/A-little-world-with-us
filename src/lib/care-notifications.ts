// src/lib/care-notifications.ts
// Care page notification utilities for period tracking

import { supabase } from './supabase'

export interface CareNotification {
  id: string
  type: 'period-reminder' | 'fertile-alert' | 'symptom-checkin'
  title: string
  titleMy: string
  body: string
  bodyMy: string
  scheduledTime: Date
  enabled: boolean
}

export const careNotificationTemplates: Omit<CareNotification, 'id' | 'scheduledTime'>[] = [
  {
    type: 'period-reminder',
    title: 'Period Reminder',
    titleMy: 'ရာသီလာလအသတိုပါ',
    body: 'Your period is expected tomorrow. Be prepared!',
    bodyMy: 'မနေ့မနက် ရာသီလာလလာနိုင်မည့်ပါ။ ပြင်ဆင်ထားပါ။',
    enabled: true,
  },
  {
    type: 'fertile-alert',
    title: 'Fertile Window',
    titleMy: 'သားဖောက်ချိန်',
    body: 'You are entering your fertile window. This is a good time for family planning.',
    bodyMy: 'သားဖောက်ချိန်ထဲ့ရောက်ပါ။ မိသားလုပ်စီမှုအတွက် ကောင်သောင်းပါ။',
    enabled: true,
  },
  {
    type: 'symptom-checkin',
    title: 'Symptom Check-In',
    titleMy: 'ကိုက်ခဲမှုစစ်ဆေးခြင်း',
    body: 'Don\'t forget to log your symptoms today!',
    bodyMy: 'ယနေ့ ကိုက်ခဲမှုစစ်ဆေးခြင်းမှု မမေ့ပါနှင်!',
    enabled: true,
  },
]

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show a notification
export function showNotification(title: string, body: string): void {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-512x512.png',
      tag: 'care-notification',
      requireInteraction: false,
    })
  }
}

// Schedule a notification (simplified - would use service workers in production)
export function scheduleNotification(
  notification: Omit<CareNotification, 'id'>
): void {
  // In production, this would use service workers with background sync
  // For now, we'll use setTimeout as a simple implementation
  const delay = notification.scheduledTime.getTime() - Date.now()
  
  if (delay > 0) {
    setTimeout(() => {
      if (notification.enabled) {
        showNotification(notification.title, notification.body)
      }
    }, delay)
  }
}

// Check if notifications are supported and permitted
export function areNotificationsEnabled(): boolean {
  if (!('Notification' in window)) {
    return false
  }
  return Notification.permission === 'granted'
}

// Get notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

// Schedule a reminder notification
export async function scheduleReminder(type: 'pms' | 'period' | 'fertile' | 'symptom') {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('Notifications not supported or permission not granted')
    return
  }

  let title: string
  let body: string
  let delay: number

  switch (type) {
    case 'pms':
      title = 'PMS Reminder 💜'
      body = 'Your period may start soon. Take care of yourself!'
      delay = 5 * 60 * 1000 // 5 minutes for demo (in production, calculate based on cycle)
      break
    case 'period':
      title = 'Period Reminder 🩸'
      body = 'Your period may start tomorrow. Be prepared!'
      delay = 5 * 60 * 1000 // 5 minutes for demo
      break
    case 'fertile':
      title = 'Fertile Day Alert 🌸'
      body = "You're in your fertile window!"
      delay = 5 * 60 * 1000 // 5 minutes for demo
      break
    case 'symptom':
      title = 'Symptom Check-in 📝'
      body = 'Time to log your daily symptoms!'
      delay = 5 * 60 * 1000 // 5 minutes for demo
      break
    default:
      return
  }

  // Schedule notification (in production, use service workers for background)
  setTimeout(() => {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
    })
  }, delay)

  // Save last_sent_at to database
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from('care_reminders')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('reminder_type', type)
  }
}
