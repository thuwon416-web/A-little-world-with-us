'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface CycleCalendarProps {
  onDateSelect?: (date: Date) => void
}

interface CycleDay {
  date: Date
  type: 'period' | 'fertile' | 'caution' | 'normal'
  hasData: boolean
}

export default function CycleCalendar({ onDateSelect }: CycleCalendarProps) {
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
    // In production, this would come from actual cycle data
    const periodLength = 5

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfMonth = day
      
      let type: CycleDay['type'] = 'normal'
      let hasData = false

      // Simplified cycle calculation
      if (dayOfMonth <= periodLength) {
        type = 'period'
        hasData = true
      } else if (dayOfMonth >= 10 && dayOfMonth <= 16) {
        type = 'fertile'
        hasData = true
      } else if (dayOfMonth >= 8 && dayOfMonth <= 9) {
        type = 'caution'
        hasData = true
      }

      days.push({ date, type, hasData })
    }

    return days
  }, [currentDate, daysInMonth])

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (day: CycleDay) => {
    setSelectedDate(day.date)
    onDateSelect?.(day.date)
  }

  const getDayColor = (type: CycleDay['type']) => {
    switch (type) {
      case 'period':
        return 'bg-rose-500 hover:bg-rose-600 border-rose-600'
      case 'fertile':
        return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'
      case 'caution':
        return 'bg-amber-400 hover:bg-amber-500 border-amber-500'
      default:
        return 'bg-[var(--card-bg-strong)] hover:bg-[var(--accent-1)]/20 border-[var(--accent-1)]/30'
    }
  }

  const getDayLabel = (type: CycleDay['type']) => {
    switch (type) {
      case 'period':
        return 'ရာသီလာလက္ခဏာ' // Period
      case 'fertile':
        return 'သားဖောက်ချိန်' // Fertile
      case 'caution':
        return 'သတိထားရမည့်ချိန်' // Caution
      default:
        return ''
    }
  }

  return (
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
            <p className="text-xs text-[var(--text-secondary)]">Cycle Calendar</p>
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
          <span className="text-[var(--text-secondary)]">ရာသီလာလက္ခဏာ (Period)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-[var(--text-secondary)]">သားဖောက်ချိန် (Fertile)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-[var(--text-secondary)]">သတိထားရမည့်ချိန် (Caution)</span>
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
              aspect-square rounded-xl border-2 transition-all relative
              ${getDayColor(day.type)}
              ${selectedDate?.toDateString() === day.date.toDateString() ? 'ring-2 ring-[var(--accent-1)] ring-offset-2' : ''}
            `}
            title={getDayLabel(day.type)}
          >
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {day.date.getDate()}
            </span>
            {day.hasData && (
              <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-white/80" />
            )}
          </button>
        ))}
      </div>

      {/* Selected Date Info */}
      {selectedDate && (
        <div className="mt-6 p-4 rounded-2xl border border-[var(--accent-1)]/20 bg-[var(--card-bg-strong)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-2">Selected Date</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  )
}
