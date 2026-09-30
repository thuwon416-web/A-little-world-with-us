import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface WellnessCardProps {
  title: string
  value: string
  detail?: string
}

export function WellnessCard({ title, value, detail }: WellnessCardProps) {
  const { colors } = useTheme()
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
    >
      <Text style={[styles.title, { color: colors.accent2 }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      {detail ? (
        <Text style={[styles.detail, { color: colors.textSecondary }]}>{detail}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    minHeight: 120,
  },
  title: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
  },
})
