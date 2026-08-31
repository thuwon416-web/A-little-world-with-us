import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ProgressBar } from '@/components/ProgressBar'
import { PlanItem } from '@/components/PlanItem'
import type { PlanRecord } from '@/services/plans'

interface PlanCardProps {
  plan: PlanRecord
  onPress?: () => void
  onToggleItem?: (itemId: string, completed: boolean) => void
}

function getDaysUntil(dateString?: string | null) {
  if (!dateString) return 'No date'

  const target = new Date(dateString)
  const now = new Date()
  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Today'
  return `${diffDays} days left`
}

export function PlanCard({ plan, onPress, onToggleItem }: PlanCardProps) {
  const items = plan.plan_items ?? []
  const doneCount = items.filter((item) => item.completed).length
  const progress = items.length === 0 ? 0 : (doneCount / items.length) * 100

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.type}>{plan.type}</Text>
          <Text style={styles.title}>{plan.title}</Text>
        </View>
        <Text style={styles.status}>{plan.status}</Text>
      </View>

      {plan.description ? <Text style={styles.description}>{plan.description}</Text> : null}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{getDaysUntil(plan.due_date)}</Text>
        <Text style={styles.meta}>{doneCount}/{items.length || 0} done</Text>
      </View>

      <ProgressBar progress={progress} />

      <View style={styles.itemList}>
        {items.length > 0 ? (
          items.slice(0, 3).map((item) => (
            <PlanItem
              key={item.id}
              title={item.title}
              completed={item.completed}
              onToggle={() => onToggleItem?.(item.id, !item.completed)}
            />
          ))
        ) : (
          <Text style={styles.empty}>No checklist items yet.</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171b22',
    borderWidth: 1,
    borderColor: '#2a2d35',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    color: '#d9bfd7',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 20,
    fontWeight: '700',
  },
  status: {
    color: '#8ed0c4',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
    color: '#c4c4ce',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  meta: {
    color: '#c4c4ce',
    fontSize: 12,
  },
  itemList: {
    marginTop: 12,
  },
  empty: {
    color: '#c4c4ce',
    fontSize: 13,
  },
})
