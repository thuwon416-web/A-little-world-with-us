import React from 'react'
import { Check } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

const careItems = [
  { key: 'water', label: 'Water' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'meals', label: 'Meals' },
  { key: 'exercise', label: 'Exercise' },
] as const

interface CareChecklistProps {
  values?: Record<string, boolean>
  onToggle?: (key: string) => void
}

export function CareChecklist({ values = {}, onToggle }: CareChecklistProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.container}>
      {careItems.map((item) => (
        <TouchableOpacity key={item.key} hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }} style={styles.row} onPress={() => onToggle?.(item.key)}>
          <View style={[styles.check, { borderColor: colors.accent2 }, values[item.key] && { backgroundColor: colors.success, borderColor: colors.success }]}>
            {values[item.key] ? <Check size={14} color={colors.background} /> : null}
          </View>
          <Text style={[styles.label, { color: values[item.key] ? colors.success : colors.textPrimary }, values[item.key] && styles.labelDone]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
  },
  labelDone: {
    textDecorationLine: 'line-through',
  },
})
