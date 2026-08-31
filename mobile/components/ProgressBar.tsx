import React from 'react'
import { StyleSheet, View } from 'react-native'

interface ProgressBarProps {
  progress: number
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, progress))

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${value}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2a2d35',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ff6b81',
  },
})
