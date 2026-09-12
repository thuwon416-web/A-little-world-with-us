import { Frown, Heart, Moon, Smile, Sparkles, Zap } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const moods = [
  { value: 'happy', Icon: Smile, label: 'Happy' },
  { value: 'calm', Icon: Heart, label: 'Calm' },
  { value: 'excited', Icon: Sparkles, label: 'Excited' },
  { value: 'stressed', Icon: Zap, label: 'Stressed' },
  { value: 'sad', Icon: Frown, label: 'Sad' },
  { value: 'tired', Icon: Moon, label: 'Tired' },
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
          <mood.Icon
            size={22}
            color={value === mood.value ? '#0f0f12' : '#f3f0f5'}
            accessibilityLabel={`${mood.label} mood`}
          />
          <Text style={[styles.label, value === mood.value && styles.labelActive]}>
            {mood.label}
          </Text>
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
