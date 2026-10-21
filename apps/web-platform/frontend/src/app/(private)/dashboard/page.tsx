'use client'

import dynamic from 'next/dynamic'
import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_WIDGETS,
  loadDashboardLayout,
  saveDashboardLayout,
  type DashboardWidgetId,
} from '@/features/dashboard/widgetRegistry'
import { getCoupleStatus } from '@/lib/couples'
import { supabase } from '@/lib/supabase'
import ConnectedCoupleAvatars from '@/components/shared/ConnectedCoupleAvatars'
import LoveStreakBadge from '@/components/shared/LoveStreakBadge'
import { SlidersHorizontal } from 'lucide-react'

const DaysCounter = dynamic(() => import('@/features/dashboard/DaysCounter'), { loading: () => <DashboardPanelSkeleton /> })
const Countdown = dynamic(() => import('@/features/dashboard/Countdown'), { loading: () => <DashboardPanelSkeleton /> })
const CoupleLinkStatus = dynamic(() => import('@/features/auth/CoupleLinkStatus'), { loading: () => <DashboardPanelSkeleton /> })
const QuickActions = dynamic(() => import('@/features/dashboard/QuickActions'), { loading: () => <DashboardPanelSkeleton /> })
const AnniversaryShareCard = dynamic(() => import('@/features/dashboard/AnniversaryShareCard'), { loading: () => <DashboardPanelSkeleton /> })
const RelationshipStats = dynamic(() => import('@/features/dashboard/RelationshipStats'), { loading: () => <DashboardPanelSkeleton /> })
const OnThisDay = dynamic(() => import('@/features/dashboard/OnThisDay'), { loading: () => <DashboardPanelSkeleton /> })
const OurStats = dynamic(() => import('@/features/dashboard/OurStats'), { loading: () => <DashboardPanelSkeleton /> })
const MemoryOfTheDay = dynamic(() => import('@/features/memories/MemoryOfTheDay'), { loading: () => <DashboardPanelSkeleton /> })
const MiniCareCheck = dynamic(() => import('@/features/cycle/MiniCareCheck'), { loading: () => <DashboardPanelSkeleton /> })
const MusicPlayer = dynamic(() => import('@/features/dashboard/MusicPlayer'), { loading: () => <DashboardPanelSkeleton /> })
const CoupleScoreboard = dynamic(() => import('@/features/games/CoupleScoreboard'), { loading: () => <DashboardPanelSkeleton /> })

const defaultVisibility: Record<DashboardWidgetId, boolean> = {
  'days-counter': true,
  countdown: true,
  'memory-of-the-day': true,
  'mini-care-check': true,
  'music-player': true,
  'our-stats': true,
}

const widgetMap: Record<DashboardWidgetId, { label: string; render: () => JSX.Element }> = {
  'days-counter': {
    label: 'Days together',
    render: () => <DaysCounter />,
  },
  countdown: {
    label: 'Countdown',
    render: () => <Countdown targetDate={new Date().toISOString()} label="Next occasion" />,
  },
  'memory-of-the-day': {
    label: 'Memory of the day',
    render: () => <MemoryOfTheDay />,
  },
  'mini-care-check': {
    label: 'Mini care check',
    render: () => <MiniCareCheck />,
  },
  'music-player': {
    label: 'Music player',
    render: () => <MusicPlayer />,
  },
  'our-stats': {
    label: 'Our stats',
    render: () => <div className="p-4 text-xs text-text-2">Loading stats...</div>,
  },
}

function DashboardPanelSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-accent-1/10 bg-card/40 p-4">
      <div className="dashboard-shimmer h-5 w-24 rounded-full" />
      <div className="dashboard-shimmer h-20 w-full rounded-btn" />
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
    'Hold hands for a minute without talking.',
    'Say one little thing you appreciate about them before sleeping.',
    'Send a 10-second voice note of your favorite inside joke.',
    'Brew a warm drink and share the first sip together.',
    'Take a slow deep breath together.',
  ]
  return rituals[daySeed % rituals.length]
}

type ActiveOccasion = {
  title: string
  kind: 'anniversary' | 'birthday' | 'custom'
}

export default function DashboardPage() {
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [coupleName, setCoupleName] = useState('Our World')
  const [anniversary, setAnniversary] = useState<string | null>(null)
  const [activeOccasion, setActiveOccasion] = useState<ActiveOccasion | null>(null)
  const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetId[]>(DEFAULT_WIDGETS)
  const [widgetVisibility, setWidgetVisibility] =
    useState<Record<DashboardWidgetId, boolean>>(defaultVisibility)
  const [userProfile, setUserProfile] = useState<{ full_name?: string | null; avatar_url?: string | null } | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<{ full_name?: string | null; avatar_url?: string | null } | null>(null)
  const [showCustomize, setShowCustomize] = useState(false)
  const layoutReady = useRef(false)

  const heroCopy = useMemo(
    () => ({
      greeting: getTimeGreeting(),
      focus: getDailyFocus(),
      ritual: getLittleRitual(),
      occasion: 'Today is another beautiful day to love each other softly and fully.',
    }),
    []
  )

  useEffect(() => {
    const applySavedLayout = async () => {
      const saved = await loadDashboardLayout()
      if (saved?.order?.length) setWidgetOrder(saved.order)
      if (saved?.visibility) {
        setWidgetVisibility({ ...defaultVisibility, ...saved.visibility })
      }
      layoutReady.current = true
    }
    void applySavedLayout()

    const loadTodayOccasion = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: myProf } = await supabase
          .from('profiles')
          .select('full_name,avatar_url')
          .eq('id', user.id)
          .single()
        if (myProf) setUserProfile(myProf)
      }

      const { couple, partner } = await getCoupleStatus()
      if (partner) {
        setPartnerProfile({
          full_name: partner.full_name,
          avatar_url: partner.avatar_url ?? null,
        })
      }
      if (!couple) return
      setCoupleId(couple.id)
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

  const visibleWidgets = useMemo(
    () => widgetOrder.filter((id) => widgetVisibility[id] !== false),
    [widgetOrder, widgetVisibility]
  )

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
    <div
      className={`dashboard-shell mx-auto w-full max-w-7xl space-y-6 px-3 py-4 animate-fade-in sm:space-y-6 sm:px-6 sm:py-6 ${activeOccasion ? `dashboard-shell--${activeOccasion.kind}` : ''}`}
    >
      {/* Compact, Unified Hero */}
      <section className="dashboard-hero rounded-2xl border border-border/70 p-5 sm:p-6 shadow-card">
        <div className="dashboard-hero__glow" />
        <div className="dashboard-hero__content min-w-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="dashboard-pill">{heroCopy.greeting}</span>
                <CoupleLinkStatus />
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-text-1">A Little World with Us</h1>
                <span className="text-accent-1 text-xl">∞</span>
              </div>

              <p className="mt-1 text-sm text-text-2 font-medium">
                {coupleName} · {activeOccasion
                  ? activeOccasion.kind === 'anniversary'
                    ? `Happy anniversary — ${activeOccasion.title}.`
                    : activeOccasion.kind === 'birthday'
                      ? `Happy birthday — ${activeOccasion.title}.`
                      : `A little love day: ${activeOccasion.title}.`
                  : heroCopy.occasion}
              </p>

              {/* Badges & Actions Row */}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <LoveStreakBadge coupleId={coupleId} />
                <AnniversaryShareCard />
                <button
                  type="button"
                  onClick={() => setShowCustomize((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-xs text-text-2 hover:text-text-1 hover:bg-card transition"
                  title="Customize Home Widgets"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Customize
                </button>
              </div>
            </div>

            {/* Connected Couple Avatars */}
            <div className="flex shrink-0 items-center justify-center p-3 rounded-2xl bg-card/70 border border-border/60 shadow-sm backdrop-blur-sm self-start sm:self-center">
              <ConnectedCoupleAvatars
                size="xl"
                userAvatarUrl={userProfile?.avatar_url}
                partnerAvatarUrl={partnerProfile?.avatar_url}
                userName={userProfile?.full_name ?? 'You'}
                partnerName={partnerProfile?.full_name ?? 'My Love'}
                priority
              />
            </div>
          </div>

          {/* Today's Focus & Little Ritual side-by-side */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2 border-t border-border/40">
            <div className="min-w-0 rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-accent-1 block mb-0.5">Today&apos;s Focus</span>
              <p className="text-xs text-text-1 leading-relaxed">{heroCopy.focus}</p>
            </div>
            <div className="min-w-0 rounded-xl border border-border/50 bg-card/60 p-3 shadow-xs">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-accent-2 block mb-0.5">Little Ritual</span>
              <p className="text-xs text-text-1 leading-relaxed">{heroCopy.ritual}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collapsible Customize Toolbar */}
      {showCustomize && (
        <div className="rounded-2xl border border-accent-1/25 bg-card/90 p-4 backdrop-blur-md shadow-card animate-fade-in space-y-2">
          <p className="text-xs uppercase font-semibold tracking-wider text-accent-1">Customize Home Layout</p>
          <div className="flex flex-wrap gap-2">
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
      )}

      {/* Primary Interactive Widgets Grid (Immediately visible above the fold) */}
      <section className="dashboard-grid dashboard-grid--dynamic min-w-0">
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
              className="dashboard-panel dashboard-card-interactive min-w-0 rounded-2xl border border-border/70 shadow-card"
            >
              {widgetId === 'countdown' ? (
                <Countdown
                  targetDate={anniversary ?? new Date().toISOString()}
                  label={anniversary ? 'Anniversary' : 'Next occasion'}
                />
              ) : widgetId === 'our-stats' ? (
                coupleId ? <OurStats coupleId={coupleId} /> : <div className="p-5 text-center text-xs text-text-2">Link with partner to view stats</div>
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

      {/* On This Day Highlight Section */}
      {coupleId ? <OnThisDay coupleId={coupleId} /> : null}

      {/* Secondary Relationship Stats & Scoreboard */}
      <RelationshipStats />

      <section className="dashboard-panel ui-card min-w-0 rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-card" aria-label="Couple scoreboard">
        <CoupleScoreboard />
      </section>

      <QuickActions />
    </div>
  )
}
