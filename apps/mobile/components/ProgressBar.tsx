import React from 'react'
import { StyleSheet, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface ProgressBarProps {
  progress: number
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const { colors } = useTheme()
  const value = Math.max(0, Math.min(100, progress))

  return (
    <View style={[styles.track, { backgroundColor: colors.cardBorder }]}>
      <View style={[styles.fill, { width: `${value}%`, backgroundColor: colors.accent1 }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
})
