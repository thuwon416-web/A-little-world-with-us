import { Frown, Heart, Moon, Smile, Sparkles, Zap } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

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
  const { colors } = useTheme()
  return (
    <View style={styles.row}>
      {moods.map((mood) => (
        <TouchableOpacity
          key={mood.value}
          onPress={() => onSelect?.(mood.value)}
          style={[
            styles.pill,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            value === mood.value && {
              backgroundColor: colors.accent1,
              borderColor: colors.accent1,
            },
          ]}
        >
          <mood.Icon
            size={22}
            color={value === mood.value ? colors.background : colors.textPrimary}
            accessibilityLabel={`${mood.label} mood`}
          />
          <Text
            style={[
              styles.label,
              { color: value === mood.value ? colors.background : colors.textPrimary },
            ]}
          >
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
    alignItems: 'center',
    minWidth: 84,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
})
