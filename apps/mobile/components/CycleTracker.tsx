import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface CycleTrackerProps {
  prediction?: string | null
  cycleLength?: number | null
}

export function CycleTracker({ prediction, cycleLength }: CycleTrackerProps) {
  const { colors } = useTheme()
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
    >
      <Text style={[styles.title, { color: colors.accent2 }]}>Cycle track</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {cycleLength ? `${cycleLength} day cycle` : 'Tracking soon'}
      </Text>
      <Text style={[styles.subtext, { color: colors.textSecondary }]}>
        {prediction
          ? `Next predicted start: ${new Date(prediction).toLocaleDateString()}`
          : 'Cycle predictions will appear after more data.'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  title: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 13,
    lineHeight: 18,
  },
})
