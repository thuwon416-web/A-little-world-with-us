import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface PlanItemProps {
  title: string
  completed: boolean
  onToggle?: () => void
}

export function PlanItem({ title, completed, onToggle }: PlanItemProps) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.row} activeOpacity={0.8}>
      <View style={[styles.check, completed && styles.checkDone]}>
        {completed ? <Text style={styles.checkText}>✓</Text> : null}
      </View>
      <Text style={[styles.title, completed && styles.titleDone]}>{title}</Text>
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
    borderColor: '#d9bfd7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: '#ff6b81',
    borderColor: '#ff6b81',
  },
  checkText: {
    color: '#0f0f12',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#f3f0f5',
    fontSize: 14,
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: '#c4c4ce',
  },
})
