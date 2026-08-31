import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
  return (
    <View style={styles.container}>
      {careItems.map((item) => (
        <TouchableOpacity key={item.key} style={styles.row} onPress={() => onToggle?.(item.key)}>
          <View style={[styles.check, values[item.key] && styles.checkDone]}>
            {values[item.key] ? <Text style={styles.checkText}>✓</Text> : null}
          </View>
          <Text style={[styles.label, values[item.key] && styles.labelDone]}>{item.label}</Text>
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
    borderColor: '#d9bfd7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: '#2f8f66',
    borderColor: '#2f8f66',
  },
  checkText: {
    color: '#f3f0f5',
    fontWeight: '700',
    fontSize: 12,
  },
  label: {
    color: '#f3f0f5',
    fontSize: 15,
  },
  labelDone: {
    color: '#8ed0c4',
    textDecorationLine: 'line-through',
  },
})
