import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface BucketListItemProps {
  item: string
  completed: boolean
  completedAt?: string | null
  onToggle?: () => void
}

export function BucketListItem({ item, completed, completedAt, onToggle }: BucketListItemProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.85}>
      <View style={[styles.check, completed && styles.completed]}>
        {completed ? <Text style={styles.checkText}>✓</Text> : null}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.title, completed && styles.doneTitle]}>{item}</Text>
        {completedAt ? <Text style={styles.date}>Done {new Date(completedAt).toLocaleDateString()}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2d35',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9bfd7',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completed: {
    backgroundColor: '#2f8f66',
    borderColor: '#2f8f66',
  },
  checkText: {
    color: '#f3f0f5',
    fontWeight: '800',
    fontSize: 12,
  },
  meta: {
    flex: 1,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 16,
    fontWeight: '600',
  },
  doneTitle: {
    textDecorationLine: 'line-through',
    color: '#c4c4ce',
  },
  date: {
    color: '#c4c4ce',
    fontSize: 12,
    marginTop: 4,
  },
})
