import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

export default function PeriodSymptomsBoard() {
  return (
    <WellnessBoardShell title="Period Symptoms" subtitle="Care & cycle" badge="coming soon">
      <View style={styles.content}>
        <Text style={styles.title}>Symptom tracking is coming soon.</Text>
        <Text style={styles.description}>
          Use the Care tab for current cycle information and notes.
        </Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  description: { color: '#d5c4d4', lineHeight: 20 },
})
