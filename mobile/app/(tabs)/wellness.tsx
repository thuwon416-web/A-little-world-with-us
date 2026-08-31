import React, { useState, type ComponentType } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

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
  boards: ComponentType[]
}

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
      PlayfulRitualsBoard,
      RelationshipRitualsBoard,
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

      <View style={styles.grid}>
        {active.boards.map((Board, index) => (
          <View key={`${active.id}-${index}`} style={styles.boardWrap}>
            <Board />
          </View>
        ))}
      </View>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  boardWrap: {
    width: '48%',
    marginBottom: 16,
  },
})
