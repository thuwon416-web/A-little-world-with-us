'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar as CalendarIcon, Clock, Heart, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { getCurrentUserId, supabase } from '@/lib/supabase'
import { getCoupleStatus } from '@/lib/couples'
import BucketList from '@/features/planning/BucketList'
import SharedWishlist from '@/features/planning/SharedWishlist'
import RemindersPage from '@/app/(private)/reminders/page'
import ExplicitAdviceControl from '@/features/ai-guardian/ExplicitAdviceControl'
import PhotoMediaCalendar from '@/components/shared/PhotoMediaCalendar'

const FuturePlansContent = dynamic(() => import('@/app/(private)/planning/page'), { ssr: false })
const FinanceContent = dynamic(() => import('@/app/(private)/finance/page'), { ssr: false })

type PlanningSection = 'calendar' | 'plans' | 'reminders' | 'finance'
type CalendarEventType = 'date' | 'trip' | 'goal' | 'life' | 'other'

interface CalendarEvent {
  id: string
  event_date: string
  title: string
  type: CalendarEventType
  event_time: string | null
  description?: string | null
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedSection = searchParams.get('section')

  const [activeTab, setActiveTab] = useState<PlanningSection>(() =>
    ['calendar', 'plans', 'reminders', 'finance'].includes(requestedSection ?? '')
      ? (requestedSection as PlanningSection)
      : 'calendar'
  )

  const [userId, setUserId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatDate(new Date()))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  // Add Event Form State
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CalendarEventType>('date')
  const [newTime, setNewTime] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)

  useEffect(() => {
    if (['calendar', 'plans', 'reminders', 'finance'].includes(requestedSection ?? '')) {
      setActiveTab(requestedSection as PlanningSection)
    }
  }, [requestedSection])

  const selectSection = (section: PlanningSection) => {
    setActiveTab(section)
    router.replace(section === 'calendar' ? '/calendar' : `/calendar?section=${section}`, {
      scroll: false,
    })
  }

  useEffect(() => {
    const loadUserAndCouple = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
      const status = await getCoupleStatus()
      setCoupleId(status.status === 'accepted' ? (status.couple?.id ?? null) : null)
    }
    void loadUserAndCouple()
  }, [])

  const loadEvents = useCallback(async () => {
    if (!coupleId) return
    setLoadingEvents(true)
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', coupleId)
      .order('event_date', { ascending: true })

    setEvents((data ?? []) as CalendarEvent[])
    setLoadingEvents(false)
  }, [coupleId])

  useEffect(() => {
    if (coupleId) {
      void loadEvents()
      const channel = supabase
        .channel(`web-calendar-${coupleId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `couple_id=eq.${coupleId}`,
        }, () => { void loadEvents() })
        .subscribe()

      return () => { void supabase.removeChannel(channel) }
    }
  }, [coupleId, loadEvents])

  const selectedDateEvents = useMemo(() => {
    return events.filter((e) => e.event_date.slice(0, 10) === selectedDateStr)
  }, [events, selectedDateStr])

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !userId || !coupleId) return

    setSavingEvent(true)
    const { error } = await supabase.from('events').insert({
      event_date: selectedDateStr,
      event_time: newTime.trim() || null,
      title: newTitle.trim(),
      type: newType,
      user_id: userId,
      couple_id: coupleId,
    })

    setSavingEvent(false)
    if (!error) {
      setNewTitle('')
      setNewTime('')
      setIsAddingEvent(false)
      await loadEvents()
    }
  }

  const handleDeleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const selectedFormattedDate = useMemo(() => {
    try {
      const [year, month, day] = selectedDateStr.split('-').map(Number)
      return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return selectedDateStr
    }
  }, [selectedDateStr])

  const isTodaySelected = selectedDateStr === formatDate(new Date())

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif text-text-1">Planning Hub</h1>
            <span className="rounded-full bg-accent-1/10 border border-accent-1/20 px-2.5 py-0.5 text-xs font-medium text-accent-1">
              Together
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-2">
            Our shared calendar, dates, bucket list dreams, and future goals in one place.
          </p>
        </div>

        {/* Tab Switcher */}
        <nav className="flex gap-1.5 overflow-x-auto self-start sm:self-auto p-1 rounded-full bg-card/60 border border-border/60 backdrop-blur-sm" aria-label="Calendar sections">
          {(['calendar', 'plans', 'reminders', 'finance'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectSection(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-accent-1 text-white shadow-sm'
                  : 'text-text-2 hover:text-text-1 hover:bg-card'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Tab Views */}
      {activeTab === 'plans' && <FuturePlansContent />}
      {activeTab === 'reminders' && <RemindersPage />}
      {activeTab === 'finance' && <FinanceContent />}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Top 2-Column Calendar & Day Agenda */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Compact, Proportional Photo & Event Calendar */}
            <div className="lg:col-span-7 xl:col-span-7 flex justify-center">
              <div className="w-full max-w-[480px]">
                <PhotoMediaCalendar
                  coupleId={coupleId}
                  onSelectDate={(dateStr) => setSelectedDateStr(dateStr)}
                  className="shadow-card border-border/70"
                />
              </div>
            </div>

            {/* Right: Selected Date Agenda & Quick Add */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="glass-card rounded-2xl border border-border/70 bg-card p-5 shadow-card space-y-4">
                {/* Date Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-accent-1" />
                      <h2 className="text-base font-serif font-semibold text-text-1">
                        {selectedFormattedDate}
                      </h2>
                    </div>
                    {isTodaySelected && (
                      <span className="inline-block mt-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingEvent((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-accent-1 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition active:scale-95"
                  >
                    {isAddingEvent ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {isAddingEvent ? 'Cancel' : 'Add Plan'}
                  </button>
                </div>

                {/* Add Event Form Drawer */}
                {isAddingEvent && (
                  <form onSubmit={handleSaveEvent} className="p-3.5 rounded-xl border border-accent-1/25 bg-accent-1/5 space-y-3 animate-fade-in">
                    <p className="text-xs font-semibold text-accent-1">Schedule for this day</p>
                    <input
                      type="text"
                      placeholder="e.g. Candlelight Dinner, Movie Date, Trip..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      autoFocus
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-text-1 placeholder:text-text-2/60 focus:outline-none focus:ring-1 focus:ring-accent-1"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as CalendarEventType)}
                        className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                      >
                        <option value="date">Romantic Date</option>
                        <option value="trip">Travel / Trip</option>
                        <option value="goal">Life Goal</option>
                        <option value="life">Milestone</option>
                        <option value="other">Reminder</option>
                      </select>

                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-text-1 focus:outline-none focus:ring-1 focus:ring-accent-1"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingEvent || !newTitle.trim()}
                      className="w-full rounded-lg bg-accent-1 py-2 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
                    >
                      {savingEvent ? 'Saving...' : 'Save to Our Calendar'}
                    </button>
                  </form>
                )}

                {/* Selected Date Events List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-text-2">
                    <span>Events & Occasions</span>
                    <span>{selectedDateEvents.length} scheduled</span>
                  </div>

                  {loadingEvents ? (
                    <div className="py-6 text-center text-xs text-text-2 animate-pulse">Loading plans…</div>
                  ) : selectedDateEvents.length === 0 ? (
                    <div className="py-8 text-center rounded-xl border border-dashed border-border/60 bg-card/40">
                      <Sparkles className="mx-auto h-5 w-5 text-accent-1/50 mb-1.5" />
                      <p className="text-xs text-text-2">No plans recorded for this day.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddingEvent(true)}
                        className="mt-2 text-xs text-accent-1 hover:underline font-medium"
                      >
                        + Plan something sweet
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateEvents.map((event) => (
                        <div
                          key={event.id}
                          className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card/60 hover:border-accent-1/30 transition shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-1/10 text-accent-1">
                              <Heart className="h-3.5 w-3.5 fill-current" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-text-1 truncate">{event.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-text-2">
                                <span className="capitalize">{event.type}</span>
                                {event.event_time && (
                                  <>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="h-2.5 w-2.5" />
                                      {event.event_time}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1 rounded-full text-text-2 hover:bg-error/10 hover:text-error transition opacity-0 group-hover:opacity-100"
                            title="Delete plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 2-Column: Bucket List & Shared Wishlist */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card rounded-2xl border border-border/70 bg-card p-5 shadow-card">
              <BucketList />
            </div>

            <div className="glass-card rounded-2xl border border-border/70 bg-card p-5 shadow-card">
              <SharedWishlist />
            </div>
          </div>
        </div>
      )}

      {/* AI Advice Footer */}
      <ExplicitAdviceControl
        title="Plan a kinder conversation"
        description="Ask the mediator for a small repair step around an upcoming plan or event."
        placeholder="What do we need to coordinate without turning it into an argument?"
      />
    </div>
  )
}
