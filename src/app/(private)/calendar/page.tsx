'use client'
import { useState, useEffect, useCallback } from 'react'
import { getCurrentUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import LoveCalendar from '@/features/planning/LoveCalendar'
import BucketList from '@/features/planning/BucketList'
import SharedWishlist from '@/features/planning/SharedWishlist'

type CalendarEvent = { id: string; date: string; title: string; type: string | null }

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showSharedCalendar, setShowSharedCalendar] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
      const status = await getCoupleStatus()
      setCoupleId(status.status === 'accepted' ? status.couple?.id ?? null : null)
    }
    loadUserId()
  }, [])

  const loadEvents = useCallback(async () => {
    if (!coupleId) return

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('date', startOfMonth.toISOString())
      .lte('date', endOfMonth.toISOString())
      .order('date', { ascending: true })

    setEvents((data ?? []) as CalendarEvent[])
  }, [currentDate, coupleId])

  useEffect(() => {
    if (userId && showSharedCalendar) {
      loadEvents()
    }
  }, [loadEvents, userId, showSharedCalendar])

  const addEvent = useCallback(async () => {
    if (!selectedDate || !userId || !coupleId) return

    const title = prompt('Event title:')
    if (!title) return

    const type = prompt('Type (anniversary, date, reminder):') || 'reminder'

    await supabase.from('calendar_events').insert({
      date: selectedDate.toISOString(),
      title,
      type,
      user_id: userId,
      couple_id: coupleId,
    })

    await loadEvents()
  }, [selectedDate, userId, coupleId, loadEvents])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    return { days, firstDay }
  }

  const { days, firstDay } = getDaysInMonth(currentDate)

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1
          className="text-4xl text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Calendar & Planning
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Our events, goals, and dreams</p>
      </header>

      <section className="space-y-6">
        <div className="glass-card p-5">
          <LoveCalendar />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-5">
            <BucketList />
          </div>

          <div className="glass-card p-5">
            <SharedWishlist />
          </div>
        </div>

        {/* Shared Calendar Toggle */}
        <div className="glass-card p-5">
          <button
            onClick={() => setShowSharedCalendar(!showSharedCalendar)}
            className="w-full text-[var(--text-primary)] font-medium p-3 border border-[var(--accent-1)]/20 rounded-xl hover:bg-[var(--accent-1)]/10"
          >
            {showSharedCalendar ? 'Hide Shared Calendar' : 'Show Shared Calendar'}
          </button>

          {showSharedCalendar && (
            <div className="mt-4 space-y-4">
              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
                  }}
                  className="px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--accent-1)]/10"
                >
                  ← Previous
                </button>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => {
                    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
                  }}
                  className="px-4 py-2 rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-primary)] hover:bg-[var(--accent-1)]/10"
                >
                  Next →
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-bold text-[var(--text-secondary)] py-2">
                    {day}
                  </div>
                ))}

                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}

                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const dayEvents = events.filter(e => new Date(e.date).getDate() === day)

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 border rounded-xl min-h-[80px] ${
                        dayEvents.length > 0 
                          ? 'border-[var(--accent-1)]/30 bg-[var(--accent-1)]/10' 
                          : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)]'
                      } text-[var(--text-primary)] hover:border-[var(--accent-1)]/50`}
                    >
                      <div className="font-bold">{day}</div>
                      {dayEvents.map(event => (
                        <div key={event.id} className="text-xs mt-1 truncate text-[var(--text-secondary)]">
                          {event.title}
                        </div>
                      ))}
                    </button>
                  )
                })}
              </div>

              {/* Add Event */}
              {selectedDate && (
                <div className="rounded-[24px] border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-5">
                  <h3 className="font-bold text-xl mb-2 text-[var(--text-primary)]">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => void addEvent()}
                    className="w-full bg-[var(--accent-1)] text-[var(--bg-color)] py-3 rounded-xl font-medium"
                  >
                    + Add Event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
