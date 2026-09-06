'use client'

import { useState, useEffect } from 'react'
import { requestNotificationPermission } from '@/lib/notifications'

export default function NotificationPermission() {
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  const handleRequest = async () => {
    const granted = await requestNotificationPermission()
    setPermissionGranted(granted)
  }

  if (permissionGranted) {
    return null
  }

  return (
    <div className="p-4 bg-[var(--accent-1)]/10 rounded-2xl border border-[var(--accent-1)]/20">
      <h3 className="font-medium text-[var(--text-primary)] mb-2">🔔 Enable Notifications</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Stay updated with reminders and important alerts
      </p>
      <button
        onClick={handleRequest}
        className="px-4 py-2 bg-[var(--accent-1)] hover:bg-[var(--accent-1)]/60 rounded-lg text-sm transition text-white"
      >
        Enable Notifications
      </button>
    </div>
  )
}
