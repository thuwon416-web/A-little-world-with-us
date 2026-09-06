import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { enabledBoards, WellnessBoard } from '@/data/wellness-boards'

// Import only the enabled components
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
import GoldenLowBoard from '@/components/wellness/GoldenLowBoard'
import GratitudeWall from '@/components/wellness/GratitudeWall'
import LoveNotesBoard from '@/components/wellness/LoveNotesBoard'
import MellowBloomBoard from '@/components/wellness/MellowBloomBoard'
import ReassuranceCounter from '@/components/wellness/ReassuranceCounter'
import LoveCheckInBoard from '@/components/wellness/LoveCheckInBoard'
import SteadyLandingBoard from '@/components/wellness/SteadyLandingBoard'
import TenderCompassBoard from '@/components/wellness/TenderCompassBoard'

// Map component names to actual components
const componentMap: Record<string, React.ComponentType> = {
  'AffirmationDeck': AffirmationDeck,
  'ApologyCorner': ApologyCorner,
  'AppreciationJar': AppreciationJar,
  'CoupleMoodMeter': CoupleMoodMeter,
  'CouplePromiseBoard': CouplePromiseBoard,
  'EverydayRitualsBoard': EverydayRitualsBoard,
  'EasyBreathBoard': EasyBreathBoard,
  'GentleHoldBoard': GentleHoldBoard,
  'GentleForecastBoard': GentleForecastBoard,
  'CarefulQuietBoard': CarefulQuietBoard,
  'DayEchoBoard': DayEchoBoard,
  'CozyReentryBoard': CozyReentryBoard,
  'ArmchairMomentBoard': ArmchairMomentBoard,
  'GratitudeWall': GratitudeWall,
  'LoveNotesBoard': LoveNotesBoard,
  'ReassuranceCounter': ReassuranceCounter,
  'GoldenLowBoard': GoldenLowBoard,
  'LoveCheckInBoard': LoveCheckInBoard,
  'MellowBloomBoard': MellowBloomBoard,
  'SteadyLandingBoard': SteadyLandingBoard,
  'TenderCompassBoard': TenderCompassBoard,
}

export default function WellnessScreen() {
  const [selectedBoard, setSelectedBoard] = useState<WellnessBoard | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelectBoard = async (board: WellnessBoard) => {
    setLoading(true)
    setSelectedBoard(board)
    // Small delay to show loading state
    setTimeout(() => setLoading(false), 100)
  }

  const renderBoard = () => {
    if (!selectedBoard) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Select a wellness board</Text>
        </View>
      )
    }

    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading {selectedBoard.name}...</Text>
        </View>
      )
    }

    const BoardComponent = componentMap[selectedBoard.component]
    if (!BoardComponent) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Board not found</Text>
        </View>
      )
    }

    return <BoardComponent />
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wellness Boards</Text>
        <Text style={styles.subtitle}>{enabledBoards.length} boards available</Text>
      </View>

      {/* Board selector - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selector}
        contentContainerStyle={styles.selectorContent}
      >
        {enabledBoards.map((board) => (
          <TouchableOpacity
            key={board.id}
            style={[
              styles.boardButton,
              selectedBoard?.id === board.id && styles.boardButtonActive,
            ]}
            onPress={() => handleSelectBoard(board)}
          >
            <Text style={styles.boardIcon}>{board.icon}</Text>
            <Text style={styles.boardName}>{board.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected board */}
      <View style={styles.boardContainer}>
        {renderBoard()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f13',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#171b27',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4edf5',
  },
  subtitle: {
    fontSize: 14,
    color: '#d5c4d4',
    marginTop: 4,
  },
  selector: {
    backgroundColor: '#171b27',
    borderBottomWidth: 1,
    borderBottomColor: '#2d3140',
  },
  selectorContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  boardButton: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#2d3140',
    minWidth: 80,
  },
  boardButtonActive: {
    backgroundColor: '#221d2d',
    borderWidth: 1,
    borderColor: '#d8b9c8',
  },
  boardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  boardName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#d8c5d7',
  },
  boardContainer: {
    flex: 1,
    padding: 16,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#d5c4d4',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#d5c4d4',
  },
})
