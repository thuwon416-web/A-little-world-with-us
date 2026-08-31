import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const moods = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'excited', emoji: '🤩', label: 'Excited' },
  { value: 'stressed', emoji: '😵', label: 'Stressed' },
  { value: 'sad', emoji: '😔', label: 'Sad' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
] as const

interface MoodSelectorProps {
  value?: string
  onSelect?: (value: string) => void
}

export function MoodSelector({ value, onSelect }: MoodSelectorProps) {
  return (
    <View style={styles.row}>
      {moods.map((mood) => (
        <TouchableOpacity
          key={mood.value}
          onPress={() => onSelect?.(mood.value)}
          style={[styles.pill, value === mood.value && styles.pillActive]}
        >
          <Text style={styles.emoji}>{mood.emoji}</Text>
          <Text style={[styles.label, value === mood.value && styles.labelActive]}>{mood.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d35',
    backgroundColor: '#11161d',
    alignItems: 'center',
    minWidth: 84,
  },
  pillActive: {
    backgroundColor: '#ff6b81',
    borderColor: '#ff6b81',
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    color: '#f3f0f5',
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    color: '#0f0f12',
  },
})
