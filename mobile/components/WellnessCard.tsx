import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface WellnessCardProps {
  title: string
  value: string
  detail?: string
}

export function WellnessCard({ title, value, detail }: WellnessCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
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
    minHeight: 120,
  },
  title: {
    color: '#d9bfd7',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  value: {
    color: '#f3f0f5',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  detail: {
    color: '#c4c4ce',
    fontSize: 13,
    lineHeight: 18,
  },
})
