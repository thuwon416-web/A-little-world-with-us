'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/notifications'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NotificationPermission() {
  const { t } = useLanguage()
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
    <div className="p-4 bg-accent-1/10 rounded-btn border border-accent-1/20">
      <h3 className="mb-2 flex items-center gap-2 font-medium text-text-1"><Bell className="icon-wiggle-once h-4 w-4" /> {t('Settings.enableNotifications')}</h3>
      <p className="text-sm text-text-2 mb-4">
        {t('Settings.notificationDescription')}
      </p>
      <button
        onClick={handleRequest}
        className="px-4 py-2 bg-accent-1 hover:bg-accent-1/60 rounded-lg text-sm transition text-white font-semibold shadow-sm"
      >
        Enable Notifications
      </button>
    </div>
  )
}
