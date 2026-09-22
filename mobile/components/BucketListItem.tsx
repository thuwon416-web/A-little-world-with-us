import React from 'react'
import { Check } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

interface BucketListItemProps {
  item: string
  completed: boolean
  completedAt?: string | null
  onToggle?: () => void
}

export function BucketListItem({ item, completed, completedAt, onToggle }: BucketListItemProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }} style={[styles.row, { borderBottomColor: colors.cardBorder }]} onPress={onToggle} activeOpacity={0.85}>
      <View style={[styles.check, { borderColor: colors.accent2 }, completed && { backgroundColor: colors.success, borderColor: colors.success }]}>
        {completed ? <Check size={14} color={colors.background} /> : null}
      </View>
      <View style={styles.meta}>
        <Text style={[styles.title, { color: completed ? colors.textSecondary : colors.textPrimary }, completed && styles.doneTitle]}>{item}</Text>
        {completedAt ? (
          <Text style={[styles.date, { color: colors.textSecondary }]}>Done {new Date(completedAt).toLocaleDateString()}</Text>
        ) : null}
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
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
})
