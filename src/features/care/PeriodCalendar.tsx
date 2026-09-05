'use client'

import { useEffect, useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { supabase } from '@/lib/supabase'
import { getDailyLogs, calculateCycleData, type CycleData } from '@/lib/care-data'

interface PeriodCalendarProps {
  onDateSelect?: (date: Date) => void
}

export default function PeriodCalendar({ onDateSelect }: PeriodCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [loading, setLoading] = useState(true)
  const [cycleData, setCycleData] = useState<CycleData | null>(null)
  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set())
  const [fertileDates, setFertileDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch daily logs
      const logs = await getDailyLogs(user.id)

      // Calculate cycle data
      const calculated = calculateCycleData(logs)
      setCycleData(calculated)

      // Extract period dates from logs
      const periodDatesSet = new Set<string>()
      logs.forEach(log => {
        if (log.symptoms?.includes('Period started') || log.other_tags?.includes('Period start')) {
          // Mark this date and next 4 days as period
          const startDate = new Date(log.log_date)
          for (let i = 0; i < 5; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            periodDatesSet.add(date.toISOString().split('T')[0])
          }
        }
      })
      setPeriodDates(periodDatesSet)

      // Calculate fertile window dates
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

  const getDayClass = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    if (periodDates.has(dateStr)) {
      return 'bg-pink-600 text-white rounded-full'
    }
    if (fertileDates.has(dateStr)) {
      return 'bg-green-600/30 border-2 border-green-600 rounded-full'
    }
    if (dateStr === today) {
      return 'bg-red-600 text-white rounded-full font-bold'
    }
    return ''
  }

  const handleDateClick = (date: Date | undefined) => {
    setSelectedDate(date)
    onDateSelect?.(date!)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Period Calendar</h2>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateClick}
        className="rounded-md border bg-white/10"
        modifiers={{
          period: (date) => periodDates.has(date.toISOString().split('T')[0]),
          fertile: (date) => fertileDates.has(date.toISOString().split('T')[0]),
          today: (date) => date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
        }}
        modifiersClassNames={{
          period: 'bg-pink-600 text-white rounded-full',
          fertile: 'bg-green-600/30 border-2 border-green-600 rounded-full',
          today: 'bg-red-600 text-white rounded-full font-bold',
        }}
      />

      {selectedDate && (
        <div className="p-4 bg-white/10 rounded-lg">
          <h3 className="font-semibold mb-2">
            {selectedDate.toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <div className="space-y-2 text-sm">
            {periodDates.has(selectedDate.toISOString().split('T')[0]) && (
              <p className="flex items-center gap-2">
                <span>🩸</span>
                <span>Period day</span>
              </p>
            )}
            {fertileDates.has(selectedDate.toISOString().split('T')[0]) && (
              <p className="flex items-center gap-2">
                <span>🌸</span>
                <span>Fertile day</span>
              </p>
            )}
            {selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
              <p className="flex items-center gap-2">
                <span>🔴</span>
                <span>Today</span>
              </p>
            )}
            {!periodDates.has(selectedDate.toISOString().split('T')[0]) &&
             !fertileDates.has(selectedDate.toISOString().split('T')[0]) &&
             selectedDate.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0] && (
              <p className="text-gray-400">Regular day</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-600 rounded-full"></div>
          <span>Period</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600/30 border-2 border-green-600 rounded-full"></div>
          <span>Fertile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded-full"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
