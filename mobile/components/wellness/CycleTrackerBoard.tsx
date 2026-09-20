import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'

import { WellnessBoardShell } from './WellnessBoardShell'

export default function CycleTrackerBoard() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <WellnessBoardShell title="Cycle Tracker" subtitle="Care & cycle" badge="coming soon">
      <View style={styles.content}>
        <Text style={styles.title}>Cycle tracking is coming soon.</Text>
        <Text style={styles.description}>
          Use the Care tab to record cycle dates while this board is being connected.
        </Text>
      </View>
    </WellnessBoardShell>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  content: { gap: 8 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  description: { color: colors.textSecondary, lineHeight: 20 },
})
