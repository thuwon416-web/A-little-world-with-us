'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, LayoutDashboard, Calendar, TrendingUp, Settings } from 'lucide-react'
import CycleDashboard from '@/features/care/CycleDashboard'
import DailyLogModal from '@/features/care/DailyLogModal'
import PeriodCalendar from '@/features/care/PeriodCalendar'
import InsightsTrends from '@/features/care/InsightsTrends'
import SmartReminders from '@/features/care/SmartReminders'
import { requestNotificationPermission, areNotificationsEnabled } from '@/lib/care-notifications'

type TabType = 'dashboard' | 'calendar' | 'insights' | 'reminders'

export default function CarePage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setNotificationsEnabled(areNotificationsEnabled())
  }, [])

  const handleLogSaved = () => {
    // Refresh cycle data, calendar, insights, etc.
    setRefreshKey(prev => prev + 1)
  }

  const handleOpenDailyLog = () => {
    setIsDailyLogOpen(true)
  }

  const handleRemindersClick = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      setNotificationsEnabled(granted)
    } else {
      setActiveTab('reminders')
    }
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar },
    { id: 'insights' as TabType, label: 'Insights', icon: TrendingUp },
    { id: 'reminders' as TabType, label: 'Reminders', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-secondary)]">Health & Wellness</p>
          <h1 className="mt-2 text-3xl font-serif text-[var(--text-primary)]">Cycle Care</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenDailyLog}
            className="flex items-center gap-2 rounded-full bg-[var(--accent-2)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Log Today
          </button>
          <button
            type="button"
            onClick={handleRemindersClick}
            className="flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-[var(--bg-color)] transition hover:opacity-90"
          >
            <Bell className="h-4 w-4" />
            {notificationsEnabled ? 'Notifications On' : 'Enable Reminders'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[var(--accent-1)]/20 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-1)]/10 text-[var(--accent-1)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/5 hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'dashboard' && <CycleDashboard key={refreshKey} onOpenDailyLog={handleOpenDailyLog} />}
        {activeTab === 'calendar' && <PeriodCalendar key={refreshKey} />}
        {activeTab === 'insights' && <InsightsTrends key={refreshKey} />}
        {activeTab === 'reminders' && <SmartReminders key={refreshKey} />}
      </div>

      {/* Daily Log Modal */}
      <DailyLogModal
        isOpen={isDailyLogOpen}
        onClose={() => setIsDailyLogOpen(false)}
        selectedDate={selectedDate}
        onLogSaved={handleLogSaved}
      />
    </div>
  )
}
