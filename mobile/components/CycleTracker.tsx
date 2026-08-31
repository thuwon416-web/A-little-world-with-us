import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface CycleTrackerProps {
  prediction?: string | null
  cycleLength?: number | null
}

export function CycleTracker({ prediction, cycleLength }: CycleTrackerProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Cycle track</Text>
      <Text style={styles.value}>{cycleLength ? `${cycleLength} day cycle` : 'Tracking soon'}</Text>
      <Text style={styles.subtext}>{prediction ? `Next predicted start: ${new Date(prediction).toLocaleDateString()}` : 'Cycle predictions will appear after more data.'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171b22',
    borderWidth: 1,
    borderColor: '#2a2d35',
    borderRadius: 18,
    padding: 18,
  },
  title: {
    color: '#d9bfd7',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  value: {
    color: '#f3f0f5',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtext: {
    color: '#c4c4ce',
    fontSize: 13,
    lineHeight: 18,
  },
})
