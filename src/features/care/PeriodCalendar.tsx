'use client'

import { useEffect, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { supabase } from '@/lib/supabase'
import { getDailyLogs, calculateCycleData } from '@/lib/care-data'

interface PeriodCalendarProps {
  onDateSelect?: (date: Date) => void
}

export default function PeriodCalendar({ onDateSelect }: PeriodCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set())
  const [fertileDates, setFertileDates] = useState<Set<string>>(new Set())

  useEffect(() => { loadCalendarData() }, [])

  const loadCalendarData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const logs = await getDailyLogs(user.id)
      const calculated = calculateCycleData(logs)

      const periodDatesSet = new Set<string>()
      logs.forEach(log => {
        if (log.symptoms?.includes('Period started') || log.other_tags?.includes('Period start')) {
          const startDate = new Date(log.log_date)
          for (let i = 0; i < 5; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            periodDatesSet.add(date.toISOString().split('T')[0])
          }
        }
      })
      setPeriodDates(periodDatesSet)

      const fertileDatesSet = new Set<string>()
      if (calculated.fertile_window_start && calculated.fertile_window_end) {
        const startDate = new Date(calculated.fertile_window_start)
        const endDate = new Date(calculated.fertile_window_end)
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          fertileDatesSet.add(new Date(d).toISOString().split('T')[0])
        }
      }
      setFertileDates(fertileDatesSet)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date | undefined) => {
    setSelectedDate(date)
    onDateSelect?.(date!)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--accent-2)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-serif text-[var(--text-primary)]">Period Calendar</h2>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateClick}
        className="glass-card rounded-md border p-4"
        modifiers={{
          period: (date) => periodDates.has(date.toISOString().split('T')[0]),
          fertile: (date) => fertileDates.has(date.toISOString().split('T')[0]),
          today: (date) => date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
        }}
        modifiersClassNames={{
          period: 'bg-[var(--accent-1)] text-white rounded-full',
          fertile: 'bg-emerald-400/30 border-2 border-emerald-500 rounded-full',
          today: 'bg-[var(--accent-2)] text-[var(--bg-color)] rounded-full font-bold',
        }}
      />

      {selectedDate && (
        <div className="glass-card p-4">
          <h3 className="mb-2 font-semibold text-[var(--text-primary)]">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2 text-sm text-[var(--text-primary)]">
            {periodDates.has(selectedDate.toISOString().split('T')[0]) && (
              <p className="flex items-center gap-2"><span>🩸</span><span>Period day</span></p>
            )}
            {fertileDates.has(selectedDate.toISOString().split('T')[0]) && (
              <p className="flex items-center gap-2"><span>🌸</span><span>Fertile day</span></p>
            )}
            {selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
              <p className="flex items-center gap-2"><span>🔴</span><span>Today</span></p>
            )}
            {!periodDates.has(selectedDate.toISOString().split('T')[0]) &&
             !fertileDates.has(selectedDate.toISOString().split('T')[0]) &&
             selectedDate.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0] && (
              <p className="text-[var(--text-secondary)]">Regular day</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-[var(--accent-1)]" /><span>Period</span></div>
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border-2 border-emerald-500 bg-emerald-500/30" /><span>Fertile</span></div>
        <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full bg-[var(--accent-2)]" /><span>Today</span></div>
      </div>
    </div>
  )
}
