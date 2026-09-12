'use client'

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import DaysCounter from '@/features/dashboard/DaysCounter'
import Countdown from '@/features/dashboard/Countdown'
import CoupleLinkStatus from '@/features/auth/CoupleLinkStatus'
import QuickActions from '@/features/dashboard/QuickActions'
import AnniversaryShareCard from '@/features/dashboard/AnniversaryShareCard'
import RelationshipStats from '@/features/dashboard/RelationshipStats'
import {
  DEFAULT_WIDGETS,
  loadDashboardLayout,
  saveDashboardLayout,
  type DashboardWidgetId,
} from '@/features/dashboard/widgetRegistry'
import { getCoupleStatus } from '@/lib/couples'
import { supabase } from '@/lib/supabase'

const MemoryOfTheDay = lazy(() => import('@/features/memories/MemoryOfTheDay'))
const MiniCareCheck = lazy(() => import('@/features/cycle/MiniCareCheck'))
const MusicPlayer = lazy(() => import('@/features/dashboard/MusicPlayer'))

const defaultVisibility: Record<DashboardWidgetId, boolean> = {
  'days-counter': true,
  countdown: true,
  'memory-of-the-day': true,
  'mini-care-check': true,
  'music-player': true,
}

const widgetMap: Record<DashboardWidgetId, { label: string; render: () => JSX.Element }> = {
  'days-counter': {
    label: 'Days together',
    render: () => <DaysCounter />,
  },
  countdown: {
    label: 'Countdown',
    render: () => <Countdown targetDate="2000-09-10" label="Her Birthday" />,
  },
  'memory-of-the-day': {
    label: 'Memory of the day',
    render: () => (
      <Suspense fallback={<DashboardPanelSkeleton />}>
        <MemoryOfTheDay />
      </Suspense>
    ),
  },
  'mini-care-check': {
    label: 'Mini care check',
    render: () => (
      <Suspense fallback={<DashboardPanelSkeleton />}>
        <MiniCareCheck />
      </Suspense>
    ),
  },
  'music-player': {
    label: 'Music player',
    render: () => (
      <Suspense fallback={<div className="dashboard-shimmer h-16 w-full rounded-[1.25rem]" />}>
        <MusicPlayer />
      </Suspense>
    ),
  },
}

function DashboardPanelSkeleton() {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-[var(--accent-1)]/10 bg-[var(--card-bg)]/40 p-4">
      <div className="dashboard-shimmer h-5 w-24 rounded-full" />
      <div className="dashboard-shimmer h-20 w-full rounded-2xl" />
      <div className="dashboard-shimmer h-10 w-32 rounded-full" />
    </div>
  )
}

function getTimeGreeting() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  if (hour >= 18 && hour < 22) return 'Good evening'
  return 'Good night'
}

function getDailyFocus() {
  const daySeed = new Date().getDate()
  const focuses = [
    'Slow down and enjoy the quiet rhythm of us.',
    'Make space for a little softness and calm today.',
    'Choose gentleness, even in the smallest moments.',
    'Be extra present with each other today.',
    'Hold each other with patience and warmth.',
  ]

  return focuses[daySeed % focuses.length]
}

function getLittleRitual() {
  const daySeed = new Date().getDate()
  const rituals = [
    'Share one thing that made your heart feel full today.',
    'Hold hands for a minute without talking.',
    'Send a warm voice note or sweet message.',
    'Take a slow walk and notice one beautiful thing together.',
    'Make tea or coffee and sit in the same quiet moment.',
  ]

  return rituals[daySeed % rituals.length]
}

type ActiveOccasion = { title: string; kind: 'anniversary' | 'birthday' | 'custom' }
const defaultOccasionMessage = 'Today is another beautiful day to love each other softly and fully.'

export default function DashboardPage() {
  const heroCopy = useMemo(() => {
    return {
      greeting: getTimeGreeting(),
      focus: getDailyFocus(),
      ritual: getLittleRitual(),
      occasion: defaultOccasionMessage,
    }
  }, [])

  const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetId[]>(DEFAULT_WIDGETS)
  const [widgetVisibility, setWidgetVisibility] =
    useState<Record<DashboardWidgetId, boolean>>(defaultVisibility)
  const layoutReady = useRef(false)
  const [activeOccasion, setActiveOccasion] = useState<ActiveOccasion | null>(null)
  const [coupleName, setCoupleName] = useState('Our World')
  const [anniversary, setAnniversary] = useState<string | null>(null)

  useEffect(() => {
    void loadDashboardLayout().then((saved) => {
      if (saved) {
        const validOrder = saved.order.filter((id): id is DashboardWidgetId =>
          DEFAULT_WIDGETS.includes(id as DashboardWidgetId)
        )
        setWidgetOrder(validOrder.length > 0 ? validOrder : DEFAULT_WIDGETS)
        setWidgetVisibility({ ...defaultVisibility, ...saved.visibility })
      }
      layoutReady.current = true
    })
  }, [])

  useEffect(() => {
    const loadTodayOccasion = async () => {
      const { couple } = await getCoupleStatus()
      if (!couple) return
      setCoupleName(couple.name?.trim() || 'Our World')
      setAnniversary(couple.anniversary ?? null)
      const today = new Date()
      const { data } = await supabase
        .from('couple_occasions')
        .select('title,kind,month,day')
        .eq('couple_id', couple.id)
        .eq('month', today.getMonth() + 1)
        .eq('day', today.getDate())
        .limit(1)
      const occasion = data?.[0] as (ActiveOccasion & { month: number; day: number }) | undefined
      if (occasion) setActiveOccasion({ title: occasion.title, kind: occasion.kind })
    }
    void loadTodayOccasion()
  }, [])

  useEffect(() => {
    if (!layoutReady.current) return
    void saveDashboardLayout({ order: widgetOrder, visibility: widgetVisibility })
  }, [widgetOrder, widgetVisibility])

  const visibleWidgets = widgetOrder.filter((id) => widgetVisibility[id] !== false)

  const handleWidgetDrop = (fromId: string, toId: DashboardWidgetId) => {
    if (fromId === toId) return

    setWidgetOrder((current) => {
      const next = [...current]
      const fromIndex = next.indexOf(fromId as DashboardWidgetId)
      const toIndex = next.indexOf(toId)

      if (fromIndex < 0 || toIndex < 0) return current

      const [item] = next.splice(fromIndex, 1)
      if (!item) return current
      next.splice(toIndex, 0, item)
      return next
    })
  }

  return (
    <main
      className={`dashboard-shell animate-fade-in ${activeOccasion ? `dashboard-shell--${activeOccasion.kind}` : ''}`}
    >
      <section className="dashboard-hero">
        <div className="dashboard-hero__glow" />
        <div className="dashboard-hero__content">
          <div className="dashboard-hero__topline">
            <p className="dashboard-kicker">Home</p>
            <span className="dashboard-pill">{heroCopy.greeting}</span>
          </div>

          <div className="dashboard-hero__title-wrap">
            <h1 className="dashboard-hero__title">A Little World with Us</h1>
            <span className="dashboard-hero__badge">∞</span>
          </div>

          <p className="dashboard-hero__subtitle">{coupleName}</p>
          <p className="dashboard-hero__meta">
            {activeOccasion
              ? activeOccasion.kind === 'anniversary'
                ? `Happy anniversary — ${activeOccasion.title}.`
                : activeOccasion.kind === 'birthday'
                  ? `Happy birthday — ${activeOccasion.title}.`
                  : `A little love day: ${activeOccasion.title}.`
              : heroCopy.occasion}
          </p>

          <div className="mt-4">
            <AnniversaryShareCard />
          </div>

          <div className="mt-4">
            <CoupleLinkStatus />
          </div>

          <div className="dashboard-hero__microcards">
            <div className="dashboard-mini-card">
              <span className="dashboard-mini-label">Today&apos;s focus</span>
              <p>{heroCopy.focus}</p>
            </div>
            <div className="dashboard-mini-card">
              <span className="dashboard-mini-label">Little ritual</span>
              <p>{heroCopy.ritual}</p>
            </div>
          </div>
        </div>
      </section>

      <RelationshipStats />

      <div className="dashboard-toolbar">
        <p className="dashboard-kicker">Customize home</p>
        <div className="dashboard-layout-controls">
          {DEFAULT_WIDGETS.map((widgetId) => (
            <button
              key={widgetId}
              type="button"
              onClick={() =>
                setWidgetVisibility((current) => ({
                  ...current,
                  [widgetId]: !current[widgetId],
                }))
              }
              className={`dashboard-layout-chip ${widgetVisibility[widgetId] ? 'is-active' : ''}`}
            >
              {widgetMap[widgetId].label}
            </button>
          ))}
        </div>
      </div>

      <section className="dashboard-grid dashboard-grid--dynamic">
        {visibleWidgets.map((widgetId, index) => {
          const widget = widgetMap[widgetId]

          return (
            <div
              key={widgetId}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', widgetId)
                event.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()
                const fromId = event.dataTransfer.getData('text/plain')
                handleWidgetDrop(fromId, widgetId)
              }}
              className="dashboard-panel dashboard-card-interactive"
            >
              {widgetId === 'countdown' ? (
                <Countdown
                  targetDate={anniversary ?? new Date().toISOString()}
                  label={anniversary ? 'Anniversary' : 'Next occasion'}
                />
              ) : (
                widget.render()
              )}
              <div className="dashboard-widget-drag-handle" aria-hidden="true">
                {index + 1}
              </div>
            </div>
          )
        })}
      </section>

      <QuickActions />
    </main>
  )
}
