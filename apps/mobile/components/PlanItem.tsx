import { Check } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface PlanItemProps {
  title: string
  completed: boolean
  onToggle?: () => void
}

export function PlanItem({ title, completed, onToggle }: PlanItemProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={onToggle}
      style={styles.row}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.check,
          { borderColor: colors.accent2 },
          completed && { backgroundColor: colors.accent1, borderColor: colors.accent1 },
        ]}
      >
        {completed ? <Check size={14} color={colors.background} /> : null}
      </View>
      <Text
        style={[
          styles.title,
          { color: completed ? colors.textSecondary : colors.textPrimary },
          completed && styles.titleDone,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
})
