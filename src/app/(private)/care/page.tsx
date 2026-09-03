'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import CycleCalendar from '@/features/care/CycleCalendar'
import TodayInsights from '@/features/care/TodayInsights'
import SymptomsTracker from '@/features/care/SymptomsTracker'
import CareTips from '@/features/care/CareTips'
import { requestNotificationPermission, areNotificationsEnabled } from '@/lib/care-notifications'

export default function CarePage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    setNotificationsEnabled(areNotificationsEnabled())
  }, [])

  const handleRemindersClick = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      setNotificationsEnabled(granted)
    } else {
      // Show notification settings or enable/disable logic
      alert('Notification settings - coming soon!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Health & Wellness</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Cycle Care</h1>
        </div>
        <button
          type="button"
          onClick={handleRemindersClick}
          className="flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
        >
          <Bell className="h-4 w-4" />
          {notificationsEnabled ? 'Notifications On' : 'Enable Reminders'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Left Column - Calendar & Tips */}
        <div className="space-y-6">
          <CycleCalendar onDateSelect={setSelectedDate} />
          <CareTips selectedDate={selectedDate} />
        </div>

        {/* Right Column - Insights & Symptoms */}
        <div className="space-y-6">
          <TodayInsights />
          <SymptomsTracker selectedDate={selectedDate} />
        </div>
      </div>
    </div>
  )
}
