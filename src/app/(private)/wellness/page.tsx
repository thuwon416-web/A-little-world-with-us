'use client'

import { useState, type ComponentType } from 'react'
import dynamic from 'next/dynamic'

function BoardLoading() {
  return (
    <div className="glass-card min-h-48 animate-pulse p-5">
      <div className="h-5 w-1/2 rounded bg-[var(--accent-1)]/10" />
      <div className="mt-4 h-20 rounded bg-[var(--accent-1)]/10" />
    </div>
  )
}

const AffirmationDeck = dynamic(() => import('@/features/wellness/AffirmationDeck'), {
  loading: BoardLoading,
  ssr: false,
})
const LoveNotesBoard = dynamic(() => import('@/features/wellness/LoveNotesBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const OpenWhenLetters = dynamic(() => import('@/features/wellness/OpenWhenLetters'), {
  loading: BoardLoading,
  ssr: false,
})
const SecretLetterTray = dynamic(() => import('@/features/wellness/SecretLetterTray'), {
  loading: BoardLoading,
  ssr: false,
})
const SweetNoticesBoard = dynamic(() => import('@/features/wellness/SweetNoticesBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const ApologyCorner = dynamic(() => import('@/features/wellness/ApologyCorner'), {
  loading: BoardLoading,
  ssr: false,
})
const GentleHoldBoard = dynamic(() => import('@/features/wellness/GentleHoldBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const GraceJournalBoard = dynamic(() => import('@/features/wellness/GraceJournalBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const KindPivotBoard = dynamic(() => import('@/features/wellness/KindPivotBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const ReassuranceCounter = dynamic(() => import('@/features/wellness/ReassuranceCounter'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftComfortBoard = dynamic(() => import('@/features/wellness/SoftComfortBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftRepairBoard = dynamic(() => import('@/features/wellness/SoftRepairBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const TenderWithinBoard = dynamic(() => import('@/features/wellness/TenderWithinBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const AppreciationJar = dynamic(() => import('@/features/wellness/AppreciationJar'), {
  loading: BoardLoading,
  ssr: false,
})
const CouplePromiseBoard = dynamic(() => import('@/features/wellness/CouplePromiseBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const GoldenLowBoard = dynamic(() => import('@/features/wellness/GoldenLowBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const GratitudeWall = dynamic(() => import('@/features/wellness/GratitudeWall'), {
  loading: BoardLoading,
  ssr: false,
})
const HomeEnergyBoard = dynamic(() => import('@/features/wellness/HomeEnergyBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const KindnessRootsBoard = dynamic(() => import('@/features/wellness/KindnessRootsBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SmallJoysBoard = dynamic(() => import('@/features/wellness/SmallJoysBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SweetDriftBoard = dynamic(() => import('@/features/wellness/SweetDriftBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const WarmthLedgerBoard = dynamic(() => import('@/features/wellness/WarmthLedgerBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const WarmWindowBoard = dynamic(() => import('@/features/wellness/WarmWindowBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const CoupleMoodMeter = dynamic(() => import('@/features/wellness/CoupleMoodMeter'), {
  loading: BoardLoading,
  ssr: false,
})
const DayEchoBoard = dynamic(() => import('@/features/wellness/DayEchoBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const GentleForecastBoard = dynamic(() => import('@/features/wellness/GentleForecastBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const LightEchoBoard = dynamic(() => import('@/features/wellness/LightEchoBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const LoveCheckInBoard = dynamic(() => import('@/features/wellness/LoveCheckInBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const MellowBloomBoard = dynamic(() => import('@/features/wellness/MellowBloomBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const QuietEmberBoard = dynamic(() => import('@/features/wellness/QuietEmberBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const QuietSignalBoard = dynamic(() => import('@/features/wellness/QuietSignalBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftCurrentBoard = dynamic(() => import('@/features/wellness/SoftCurrentBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftSignalBoard = dynamic(() => import('@/features/wellness/SoftSignalBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SteadyLandingBoard = dynamic(() => import('@/features/wellness/SteadyLandingBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const TenderDuskBoard = dynamic(() => import('@/features/wellness/TenderDuskBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const EverydayRitualsBoard = dynamic(() => import('@/features/wellness/EverydayRitualsBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const KindLanternBoard = dynamic(() => import('@/features/wellness/KindLanternBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const KindThreadBoard = dynamic(() => import('@/features/wellness/KindThreadBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const NestingRitualsBoard = dynamic(() => import('@/features/wellness/NestingRitualsBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const OpenHandBoard = dynamic(() => import('@/features/wellness/OpenHandBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const OpenPaceBoard = dynamic(() => import('@/features/wellness/OpenPaceBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const PlayfulRituals = dynamic(() => import('@/features/wellness/PlayfulRituals'), {
  loading: BoardLoading,
  ssr: false,
})
const RelationshipRituals = dynamic(() => import('@/features/wellness/RelationshipRituals'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftArcBoard = dynamic(() => import('@/features/wellness/SoftArcBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftConnectionBoard = dynamic(() => import('@/features/wellness/SoftConnectionBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftSafeBasisBoard = dynamic(() => import('@/features/wellness/SoftSafeBasisBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftShelterBoard = dynamic(() => import('@/features/wellness/SoftShelterBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SteadyPresenceBoard = dynamic(() => import('@/features/wellness/SteadyPresenceBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const TenderCompassBoard = dynamic(() => import('@/features/wellness/TenderCompassBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const TenderSignpostBoard = dynamic(() => import('@/features/wellness/TenderSignpostBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const ArmchairMomentBoard = dynamic(() => import('@/features/wellness/ArmchairMomentBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const CarefulQuietBoard = dynamic(() => import('@/features/wellness/CarefulQuietBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const GentleHorizonBoard = dynamic(() => import('@/features/wellness/GentleHorizonBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const MurmurBridgeBoard = dynamic(() => import('@/features/wellness/MurmurBridgeBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const QuietHarborBoard = dynamic(() => import('@/features/wellness/QuietHarborBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const QuietReturnBoard = dynamic(() => import('@/features/wellness/QuietReturnBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const ShadedQuietBoard = dynamic(() => import('@/features/wellness/ShadedQuietBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SlowArrivalBoard = dynamic(() => import('@/features/wellness/SlowArrivalBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftPlanningBoard = dynamic(() => import('@/features/wellness/SoftPlanningBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const TenderLandingBoard = dynamic(() => import('@/features/wellness/TenderLandingBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const ThoughtfulReflection = dynamic(() => import('@/features/wellness/ThoughtfulReflection'), {
  loading: BoardLoading,
  ssr: false,
})
const WarmResetBoard = dynamic(() => import('@/features/wellness/WarmResetBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const CozyReentryBoard = dynamic(() => import('@/features/wellness/CozyReentryBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const EasyBreathBoard = dynamic(() => import('@/features/wellness/EasyBreathBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const HoneyBreatheBoard = dynamic(() => import('@/features/wellness/HoneyBreatheBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const QuietAnchorBoard = dynamic(() => import('@/features/wellness/QuietAnchorBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const QuietBloomBoard = dynamic(() => import('@/features/wellness/QuietBloomBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const RestQuietBoard = dynamic(() => import('@/features/wellness/RestQuietBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SilverBreathBoard = dynamic(() => import('@/features/wellness/SilverBreathBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SlowGardenBoard = dynamic(() => import('@/features/wellness/SlowGardenBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const SoftBloomingBoard = dynamic(() => import('@/features/wellness/SoftBloomingBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const StillHushBoard = dynamic(() => import('@/features/wellness/StillHushBoard'), {
  loading: BoardLoading,
  ssr: false,
})
const CycleTrackerWidget = dynamic(() => import('@/features/wellness/CycleTrackerWidget'), {
  loading: BoardLoading,
  ssr: false,
})
const AstrologyWidget = dynamic(() => import('@/features/wellness/AstrologyWidget'), {
  loading: BoardLoading,
  ssr: false,
})

type WellnessTabId =
  | 'affirmations'
  | 'apology'
  | 'gratitude'
  | 'mood'
  | 'connection'
  | 'reflection'
  | 'calm'
type WellnessTab = { id: WellnessTabId; label: string; boards: ComponentType[] }

const tabs: WellnessTab[] = [
  {
    id: 'affirmations',
    label: 'Affirmations',
    boards: [AffirmationDeck, LoveNotesBoard, OpenWhenLetters, SecretLetterTray, SweetNoticesBoard],
  },
  {
    id: 'apology',
    label: 'Apology',
    boards: [
      ApologyCorner,
      GentleHoldBoard,
      GraceJournalBoard,
      KindPivotBoard,
      ReassuranceCounter,
      SoftComfortBoard,
      SoftRepairBoard,
      TenderWithinBoard,
    ],
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    boards: [
      AppreciationJar,
      CouplePromiseBoard,
      GoldenLowBoard,
      GratitudeWall,
      HomeEnergyBoard,
      KindnessRootsBoard,
      SmallJoysBoard,
      SweetDriftBoard,
      WarmthLedgerBoard,
      WarmWindowBoard,
    ],
  },
  {
    id: 'mood',
    label: 'Mood',
    boards: [
      CoupleMoodMeter,
      DayEchoBoard,
      GentleForecastBoard,
      LightEchoBoard,
      LoveCheckInBoard,
      MellowBloomBoard,
      QuietEmberBoard,
      QuietSignalBoard,
      SoftCurrentBoard,
      SoftSignalBoard,
      SteadyLandingBoard,
      TenderDuskBoard,
      CycleTrackerWidget,
      AstrologyWidget,
    ],
  },
  {
    id: 'connection',
    label: 'Connection',
    boards: [
      EverydayRitualsBoard,
      KindLanternBoard,
      KindThreadBoard,
      NestingRitualsBoard,
      OpenHandBoard,
      OpenPaceBoard,
      PlayfulRituals,
      RelationshipRituals,
      SoftArcBoard,
      SoftConnectionBoard,
      SoftSafeBasisBoard,
      SoftShelterBoard,
      SteadyPresenceBoard,
      TenderCompassBoard,
      TenderSignpostBoard,
    ],
  },
  {
    id: 'reflection',
    label: 'Reflection',
    boards: [
      ArmchairMomentBoard,
      CarefulQuietBoard,
      GentleHorizonBoard,
      MurmurBridgeBoard,
      QuietHarborBoard,
      QuietReturnBoard,
      ShadedQuietBoard,
      SlowArrivalBoard,
      SoftPlanningBoard,
      TenderLandingBoard,
      ThoughtfulReflection,
      WarmResetBoard,
    ],
  },
  {
    id: 'calm',
    label: 'Calm',
    boards: [
      CozyReentryBoard,
      EasyBreathBoard,
      HoneyBreatheBoard,
      QuietAnchorBoard,
      QuietBloomBoard,
      RestQuietBoard,
      SilverBreathBoard,
      SlowGardenBoard,
      SoftBloomingBoard,
      StillHushBoard,
    ],
  },
]

export default function WellnessPage() {
  const [activeTab, setActiveTab] = useState<WellnessTabId>('affirmations')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0] ?? null

  if (!active) {
    return null
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header>
        <h1
          className="text-4xl text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Wellness Boards
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          72 boards for our emotional wellness
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Wellness board categories">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? 'border-[var(--accent-1)]/40 bg-[var(--accent-1)]/20 text-[var(--accent-1)]'
                : 'border-[var(--accent-1)]/20 bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--accent-1)]/10'
            }`}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="grid gap-6 md:grid-cols-2">
        {active.boards.map((Board, index) => (
          <Board key={`${active.id}-${index}`} />
        ))}
      </section>
    </main>
  )
}
