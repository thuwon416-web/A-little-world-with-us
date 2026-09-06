import React, { useState, type ComponentType } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import AffirmationDeck from '@/components/wellness/AffirmationDeck'
import ApologyCorner from '@/components/wellness/ApologyCorner'
import AppreciationJar from '@/components/wellness/AppreciationJar'
import ArmchairMomentBoard from '@/components/wellness/ArmchairMomentBoard'
import CarefulQuietBoard from '@/components/wellness/CarefulQuietBoard'
import CoupleMoodMeter from '@/components/wellness/CoupleMoodMeter'
import CouplePromiseBoard from '@/components/wellness/CouplePromiseBoard'
import CozyReentryBoard from '@/components/wellness/CozyReentryBoard'
import DayEchoBoard from '@/components/wellness/DayEchoBoard'
import EasyBreathBoard from '@/components/wellness/EasyBreathBoard'
import EverydayRitualsBoard from '@/components/wellness/EverydayRitualsBoard'
import GentleForecastBoard from '@/components/wellness/GentleForecastBoard'
import GentleHoldBoard from '@/components/wellness/GentleHoldBoard'
import GentleHorizonBoard from '@/components/wellness/GentleHorizonBoard'
import GoldenLowBoard from '@/components/wellness/GoldenLowBoard'
import GraceJournalBoard from '@/components/wellness/GraceJournalBoard'
import GratitudeWall from '@/components/wellness/GratitudeWall'
import HomeEnergyBoard from '@/components/wellness/HomeEnergyBoard'
import HoneyBreatheBoard from '@/components/wellness/HoneyBreatheBoard'
import KindLanternBoard from '@/components/wellness/KindLanternBoard'
import KindPivotBoard from '@/components/wellness/KindPivotBoard'
import KindThreadBoard from '@/components/wellness/KindThreadBoard'
import KindnessRootsBoard from '@/components/wellness/KindnessRootsBoard'
import LightEchoBoard from '@/components/wellness/LightEchoBoard'
import LoveCheckInBoard from '@/components/wellness/LoveCheckInBoard'
import LoveNotesBoard from '@/components/wellness/LoveNotesBoard'
import MellowBloomBoard from '@/components/wellness/MellowBloomBoard'
import MurmurBridgeBoard from '@/components/wellness/MurmurBridgeBoard'
import NestingRitualsBoard from '@/components/wellness/NestingRitualsBoard'
import OpenHandBoard from '@/components/wellness/OpenHandBoard'
import OpenPaceBoard from '@/components/wellness/OpenPaceBoard'
import OpenWhenLetters from '@/components/wellness/OpenWhenLetters'
import PlayfulRitualsBoard from '@/components/wellness/PlayfulRitualsBoard'
import QuietAnchorBoard from '@/components/wellness/QuietAnchorBoard'
import QuietBloomBoard from '@/components/wellness/QuietBloomBoard'
import QuietEmberBoard from '@/components/wellness/QuietEmberBoard'
import QuietHarborBoard from '@/components/wellness/QuietHarborBoard'
import QuietReturnBoard from '@/components/wellness/QuietReturnBoard'
import QuietSignalBoard from '@/components/wellness/QuietSignalBoard'
import ReassuranceCounter from '@/components/wellness/ReassuranceCounter'
import RelationshipRitualsBoard from '@/components/wellness/RelationshipRitualsBoard'
import RestQuietBoard from '@/components/wellness/RestQuietBoard'
import SecretLetterTray from '@/components/wellness/SecretLetterTray'
import ShadedQuietBoard from '@/components/wellness/ShadedQuietBoard'
import SilverBreathBoard from '@/components/wellness/SilverBreathBoard'
import SlowArrivalBoard from '@/components/wellness/SlowArrivalBoard'
import SlowGardenBoard from '@/components/wellness/SlowGardenBoard'
import SmallJoysBoard from '@/components/wellness/SmallJoysBoard'
import SoftArcBoard from '@/components/wellness/SoftArcBoard'
import SoftBloomingBoard from '@/components/wellness/SoftBloomingBoard'
import SoftComfortBoard from '@/components/wellness/SoftComfortBoard'
import SoftConnectionBoard from '@/components/wellness/SoftConnectionBoard'
import SoftCurrentBoard from '@/components/wellness/SoftCurrentBoard'
import SoftPlanningBoard from '@/components/wellness/SoftPlanningBoard'
import SoftRepairBoard from '@/components/wellness/SoftRepairBoard'
import SoftSafeBasisBoard from '@/components/wellness/SoftSafeBasisBoard'
import SoftShelterBoard from '@/components/wellness/SoftShelterBoard'
import SoftSignalBoard from '@/components/wellness/SoftSignalBoard'
import SteadyLandingBoard from '@/components/wellness/SteadyLandingBoard'
import SteadyPresenceBoard from '@/components/wellness/SteadyPresenceBoard'
import StillHushBoard from '@/components/wellness/StillHushBoard'
import SweetDriftBoard from '@/components/wellness/SweetDriftBoard'
import SweetNoticesBoard from '@/components/wellness/SweetNoticesBoard'
import TenderCompassBoard from '@/components/wellness/TenderCompassBoard'
import TenderDuskBoard from '@/components/wellness/TenderDuskBoard'
import TenderLandingBoard from '@/components/wellness/TenderLandingBoard'
import TenderSignpostBoard from '@/components/wellness/TenderSignpostBoard'
import TenderWithinBoard from '@/components/wellness/TenderWithinBoard'
import ThoughtfulReflection from '@/components/wellness/ThoughtfulReflection'
import WarmResetBoard from '@/components/wellness/WarmResetBoard'
import WarmWindowBoard from '@/components/wellness/WarmWindowBoard'
import WarmthLedgerBoard from '@/components/wellness/WarmthLedgerBoard'

type WellnessTabId =
  'affirmations' | 'apology' | 'gratitude' | 'mood' | 'connection' | 'reflection' | 'calm'

type WellnessTab = {
  id: WellnessTabId
  label: string
  boards: Array<{ id: string; component: ComponentType }>
}

const tabs: WellnessTab[] = [
  {
    id: 'affirmations',
    label: 'Affirmations',
    boards: [
      { id: 'affirmation-deck', component: AffirmationDeck },
      { id: 'love-notes', component: LoveNotesBoard },
      { id: 'open-when-letters', component: OpenWhenLetters },
      { id: 'secret-letter-tray', component: SecretLetterTray },
      { id: 'sweet-notices', component: SweetNoticesBoard },
    ],
  },
  {
    id: 'apology',
    label: 'Apology',
    boards: [
      { id: 'apology-corner', component: ApologyCorner },
      { id: 'gentle-hold', component: GentleHoldBoard },
      { id: 'grace-journal', component: GraceJournalBoard },
      { id: 'kind-pivot', component: KindPivotBoard },
      { id: 'reassurance-counter', component: ReassuranceCounter },
      { id: 'soft-comfort', component: SoftComfortBoard },
      { id: 'soft-repair', component: SoftRepairBoard },
      { id: 'tender-within', component: TenderWithinBoard },
    ],
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    boards: [
      { id: 'appreciation-jar', component: AppreciationJar },
      { id: 'couple-promise', component: CouplePromiseBoard },
      { id: 'golden-low', component: GoldenLowBoard },
      { id: 'gratitude-wall', component: GratitudeWall },
      { id: 'home-energy', component: HomeEnergyBoard },
      { id: 'kindness-roots', component: KindnessRootsBoard },
      { id: 'small-joys', component: SmallJoysBoard },
      { id: 'sweet-drift', component: SweetDriftBoard },
      { id: 'warmth-ledger', component: WarmthLedgerBoard },
      { id: 'warm-window', component: WarmWindowBoard },
    ],
  },
  {
    id: 'mood',
    label: 'Mood',
    boards: [
      { id: 'couple-mood-meter', component: CoupleMoodMeter },
      { id: 'day-echo', component: DayEchoBoard },
      { id: 'gentle-forecast', component: GentleForecastBoard },
      { id: 'light-echo', component: LightEchoBoard },
      { id: 'love-check-in', component: LoveCheckInBoard },
      { id: 'mellow-bloom', component: MellowBloomBoard },
      { id: 'quiet-ember', component: QuietEmberBoard },
      { id: 'quiet-signal', component: QuietSignalBoard },
      { id: 'soft-current', component: SoftCurrentBoard },
      { id: 'soft-signal', component: SoftSignalBoard },
      { id: 'steady-landing', component: SteadyLandingBoard },
      { id: 'tender-dusk', component: TenderDuskBoard },
    ],
  },
  {
    id: 'connection',
    label: 'Connection',
    boards: [
      { id: 'everyday-rituals', component: EverydayRitualsBoard },
      { id: 'kind-lantern', component: KindLanternBoard },
      { id: 'kind-thread', component: KindThreadBoard },
      { id: 'nesting-rituals', component: NestingRitualsBoard },
      { id: 'open-hand', component: OpenHandBoard },
      { id: 'open-pace', component: OpenPaceBoard },
      { id: 'playful-rituals', component: PlayfulRitualsBoard },
      { id: 'relationship-rituals', component: RelationshipRitualsBoard },
      { id: 'soft-arc', component: SoftArcBoard },
      { id: 'soft-connection', component: SoftConnectionBoard },
      { id: 'soft-safe-basis', component: SoftSafeBasisBoard },
      { id: 'soft-shelter', component: SoftShelterBoard },
      { id: 'steady-presence', component: SteadyPresenceBoard },
      { id: 'tender-compass', component: TenderCompassBoard },
      { id: 'tender-signpost', component: TenderSignpostBoard },
    ],
  },
  {
    id: 'reflection',
    label: 'Reflection',
    boards: [
      { id: 'armchair-moment', component: ArmchairMomentBoard },
      { id: 'careful-quiet', component: CarefulQuietBoard },
      { id: 'gentle-horizon', component: GentleHorizonBoard },
      { id: 'murmur-bridge', component: MurmurBridgeBoard },
      { id: 'quiet-harbor', component: QuietHarborBoard },
      { id: 'quiet-return', component: QuietReturnBoard },
      { id: 'shaded-quiet', component: ShadedQuietBoard },
      { id: 'slow-arrival', component: SlowArrivalBoard },
      { id: 'soft-planning', component: SoftPlanningBoard },
      { id: 'tender-landing', component: TenderLandingBoard },
      { id: 'thoughtful-reflection', component: ThoughtfulReflection },
      { id: 'warm-reset', component: WarmResetBoard },
    ],
  },
  {
    id: 'calm',
    label: 'Calm',
    boards: [
      { id: 'cozy-reentry', component: CozyReentryBoard },
      { id: 'easy-breath', component: EasyBreathBoard },
      { id: 'honey-breathe', component: HoneyBreatheBoard },
      { id: 'quiet-anchor', component: QuietAnchorBoard },
      { id: 'quiet-bloom', component: QuietBloomBoard },
      { id: 'rest-quiet', component: RestQuietBoard },
      { id: 'silver-breath', component: SilverBreathBoard },
      { id: 'slow-garden', component: SlowGardenBoard },
      { id: 'soft-blooming', component: SoftBloomingBoard },
      { id: 'still-hush', component: StillHushBoard },
    ],
  },
]

export default function WellnessScreen() {
  const [activeTab, setActiveTab] = useState<WellnessTabId>('affirmations')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Wellness Boards</Text>
      <Text style={styles.subtitle}>72 boards for our emotional wellness</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id

          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <FlatList
        data={active.boards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.boardWrap}>
            <item.component />
          </View>
        )}
        contentContainerStyle={styles.grid}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0f0f13',
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 70,
    paddingBottom: 40,
  },
  title: {
    color: '#f4edf5',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#d5c4d4',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 18,
  },
  tabRow: {
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    backgroundColor: '#171b27',
    borderWidth: 1,
    borderColor: '#2d3140',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabSelected: {
    backgroundColor: '#221d2d',
    borderColor: '#d8b9c8',
  },
  tabText: {
    color: '#d8c5d7',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: '#f5d5e5',
  },
  grid: {
    marginTop: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  boardWrap: {
    width: '48%',
    marginBottom: 16,
  },
})
