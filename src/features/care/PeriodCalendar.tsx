'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, X, Check, Circle } from 'lucide-react'

interface PeriodCalendarProps {
  cycleData?: {
    lastPeriodStart?: Date
    cycleLength?: number
    periodLength?: number
  }
}

interface CycleDay {
  date: Date
  type: 'period' | 'predicted-period' | 'fertile' | 'ovulation' | 'normal'
  hasData: boolean
}

export default function PeriodCalendar({ cycleData }: PeriodCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }, [currentDate])

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return new Date(year, month, 1).getDay()
  }, [currentDate])

  const cycleDays = useMemo(() => {
    const days: CycleDay[] = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Calculate cycle day for each day (simplified logic)
    const periodLength = cycleData?.periodLength || 5
    const cycleLength = cycleData?.cycleLength || 28

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfMonth = day

      let type: CycleDay['type'] = 'normal'
      let hasData = false

      // Simplified cycle calculation
      if (dayOfMonth <= periodLength) {
        type = 'period'
        hasData = true
      } else if (dayOfMonth === 14) {
        type = 'ovulation'
        hasData = true
      } else if (dayOfMonth >= 10 && dayOfMonth <= 16) {
        type = 'fertile'
        hasData = true
      } else if (dayOfMonth >= periodLength + cycleLength - 3 && dayOfMonth <= periodLength + cycleLength) {
        type = 'predicted-period'
        hasData = true
      }

      days.push({ date, type, hasData })
    }

    return days
  }, [currentDate, daysInMonth, cycleData])

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day: CycleDay) => {
    setSelectedDate(day.date)
  }

  const getDayClass = (day: CycleDay) => {
    const today = new Date()
    const isToday = day.date.toDateString() === today.toDateString()

    if (isToday) {
      return 'bg-red-500 text-white border-red-500'
    }

    switch (day.type) {
      case 'period':
        return 'bg-rose-500 text-white border-rose-500'
      case 'predicted-period':
        return 'border-2 border-rose-500 border-dashed bg-rose-500/10 text-rose-500'
      case 'fertile':
        return 'bg-emerald-500 text-white border-emerald-500'
      case 'ovulation':
        return 'bg-purple-500 text-white border-purple-500'
      default:
        return 'bg-[var(--card-bg-strong)] hover:bg-[var(--accent-1)]/20 border-[var(--accent-1)]/30 text-[var(--text-primary)]'
    }
  }

  const getDayIcon = (type: CycleDay['type']) => {
    switch (type) {
      case 'period':
        return <Check className="h-3 w-3" />
      case 'predicted-period':
        return <Circle className="h-3 w-3" />
      default:
        return null
    }
  }

  const isPeriodDay = (date: Date) => {
    const day = cycleDays.find((d) => d.date.toDateString() === date.toDateString())
    return day?.type === 'period'
  }

  const isFertileDay = (date: Date) => {
    const day = cycleDays.find((d) => d.date.toDateString() === date.toDateString())
    return day?.type === 'fertile' || day?.type === 'ovulation'
  }

  const isOvulationDay = (date: Date) => {
    const day = cycleDays.find((d) => d.date.toDateString() === date.toDateString())
    return day?.type === 'ovulation'
  }

  return (
    <>
      <div className="rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif text-[var(--text-primary)]">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Period Calendar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-[var(--text-secondary)]">Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full border-2 border-rose-500 border-dashed bg-rose-500/10" />
            <span className="text-[var(--text-secondary)]">Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-[var(--text-secondary)]">Fertile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-[var(--text-secondary)]">Ovulation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-[var(--text-secondary)]">Today</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-[var(--text-secondary)] py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before first day of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {cycleDays.map((day) => (
            <button
              key={day.date.toISOString()}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square rounded-xl border-2 transition-all relative flex items-center justify-center
                ${getDayClass(day)}
                ${selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-[var(--accent-1)] ring-offset-2' : ''}
              `}
            >
              <span className="text-sm font-medium">{day.date.getDate()}</span>
              {getDayIcon(day.type) && (
                <span className="absolute bottom-1 right-1">{getDayIcon(day.type)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date Details Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-6 shadow-[0_20px_40px_rgba(19,10,33,0.28)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif text-[var(--text-primary)]">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10 hover:text-[var(--accent-1)] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
                <span className="text-sm text-[var(--text-secondary)]">Period Day</span>
                <span className={`text-sm font-medium ${isPeriodDay(selectedDate) ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                  {isPeriodDay(selectedDate) ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
                <span className="text-sm text-[var(--text-secondary)]">Fertile Day</span>
                <span className={`text-sm font-medium ${isFertileDay(selectedDate) ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}>
                  {isFertileDay(selectedDate) ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
                <span className="text-sm text-[var(--text-secondary)]">Ovulation Day</span>
                <span className={`text-sm font-medium ${isOvulationDay(selectedDate) ? 'text-purple-500' : 'text-[var(--text-primary)]'}`}>
                  {isOvulationDay(selectedDate) ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
                <span className="text-sm text-[var(--text-secondary)]">Cycle Day</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Day {selectedDate.getDate()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
