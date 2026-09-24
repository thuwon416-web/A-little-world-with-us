'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { getCurrentUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import LoveCalendar from '@/features/planning/LoveCalendar'
import BucketList from '@/features/planning/BucketList'
import SharedWishlist from '@/features/planning/SharedWishlist'
import PlansPage from '@/app/(private)/plans/page'
import RemindersPage from '@/app/(private)/reminders/page'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'

type CalendarEventType = 'date' | 'trip' | 'goal' | 'life' | 'other'
type CalendarEvent = {
  id: string
  event_date: string
  title: string
  type: CalendarEventType
  event_time: string | null
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showSharedCalendar, setShowSharedCalendar] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'plans' | 'reminders' | 'lists'>('events')
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  useEffect(() => {
    const loadUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
      const status = await getCoupleStatus()
      setCoupleId(status.status === 'accepted' ? (status.couple?.id ?? null) : null)
    }
    loadUserId()
  }, [])

  const loadEvents = useCallback(async () => {
    if (!coupleId) return
    setCalendarLoading(true)
    setCalendarError(null)

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('event_date', formatDate(startOfMonth))
      .lte('event_date', formatDate(endOfMonth))
      .order('event_date', { ascending: true })

    setCalendarLoading(false)
    if (error) {
      setCalendarError('ပြက္ခဒိန်အစီအစဉ်များကို ဖတ်မရပါ။ ခဏနေမှ ထပ်ကြိုးစားပါ။')
      return
    }
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

    const requestedType = prompt('Type (date, trip, goal, life, other):') || 'other'
    const type: CalendarEventType = ['date', 'trip', 'goal', 'life', 'other'].includes(
      requestedType
    )
      ? (requestedType as CalendarEventType)
      : 'other'

    const { error } = await supabase.from('events').insert({
      event_date: formatDate(selectedDate),
      event_time: null,
      description: null,
      repeat: null,
      title,
      type,
      user_id: userId,
      couple_id: coupleId,
    })

    if (error) {
      setCalendarError('အစီအစဉ်ကို မသိမ်းနိုင်ပါ။ ထပ်ကြိုးစားပါ။')
      return
    }

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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1
          className="text-4xl text-text-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Calendar & Plans
        </h1>
        <p className="mt-2 text-sm text-text-2">Our events, goals, and dreams</p>
      </header>

      <ExplicitAdviceControl
        title="Plan a kinder conversation"
        description="Ask the mediator for a small repair step around an upcoming plan or event."
        placeholder="What do we need to coordinate without turning it into an argument?"
      />

      <section className="space-y-6">
        <nav className="flex gap-2 overflow-x-auto" aria-label="Calendar sections">
          {(['events', 'plans', 'reminders', 'lists'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full border px-4 py-2 text-sm capitalize ${activeTab === tab ? 'border-accent-1 bg-accent-1 text-white' : 'border-accent-1/20 bg-card text-text-2'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
        {activeTab === 'plans' && <PlansPage />}
        {activeTab === 'reminders' && <RemindersPage />}
        {activeTab === 'lists' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-5">
              <BucketList />
            </div>
            <div className="glass-card p-5">
              <SharedWishlist />
            </div>
          </div>
        )}
        {activeTab !== 'events' && activeTab !== 'lists' ? null : null}
        {activeTab === 'events' && (
          <>
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
                className="w-full text-text-1 font-medium p-3 border border-accent-1/20 rounded-xl hover:bg-accent-1/10"
              >
                {showSharedCalendar ? 'Hide Shared Calendar' : 'Show Shared Calendar'}
              </button>

              {showSharedCalendar && (
                <div className="mt-4 space-y-4">
                  {calendarError && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">{calendarError}</p>}
                  {calendarLoading && <p role="status" className="text-sm text-text-2">ပြက္ခဒိန်အစီအစဉ်များကို ဖတ်နေသည်…</p>}
                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => {
                        setCurrentDate(
                          new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                        )
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-accent-1/20 bg-card px-4 py-2 text-text-1 hover:bg-accent-1/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>
                    <h2 className="text-xl font-bold text-text-1">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button
                      onClick={() => {
                        setCurrentDate(
                          new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                        )
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-accent-1/20 bg-card px-4 py-2 text-text-1 hover:bg-accent-1/10"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div
                        key={day}
                        className="text-center font-bold text-text-2 py-2"
                      >
                        {day}
                      </div>
                    ))}

                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2" />
                    ))}

                    {Array.from({ length: days }).map((_, i) => {
                      const day = i + 1
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      const dayEvents = events.filter(
                        (e) => Number(e.event_date.slice(8, 10)) === day
                      )

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(date)}
                          className={`p-2 border rounded-xl min-h-[80px] ${
                            dayEvents.length > 0
                              ? 'border-accent-1/30 bg-accent-1/10'
                              : 'border-accent-1/20 bg-card'
                          } text-text-1 hover:border-accent-1/50`}
                        >
                          <div className="font-bold">{day}</div>
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="text-xs mt-1 truncate text-text-2"
                            >
                              {event.title}
                            </div>
                          ))}
                        </button>
                      )
                    })}
                  </div>

                  {/* Add Event */}
                  {selectedDate && (
                    <div className="rounded-[24px] border border-accent-1/20 bg-card p-5">
                      <h3 className="font-bold text-xl mb-2 text-text-1">
                        {selectedDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </h3>
                      <button
                        onClick={() => void addEvent()}
                        className="w-full bg-accent-1 text-white py-3 rounded-xl font-medium"
                      >
                        + Add Event
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
