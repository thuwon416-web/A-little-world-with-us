import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { PlanItem } from '@/components/PlanItem'
import { ProgressBar } from '@/components/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/context/ThemeContext'
import type { PlanRecord } from '@/services/plans'
import { ListChecks } from 'lucide-react-native'

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
  const { colors } = useTheme()
  const items = plan.plan_items ?? []
  const doneCount = items.filter((item) => item.completed).length
  const progress = items.length === 0 ? 0 : (doneCount / items.length) * 100

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.type, { color: colors.accent2 }]}>{plan.type}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{plan.title}</Text>
        </View>
        <Text style={[styles.status, { color: colors.success }]}>{plan.status}</Text>
      </View>

      {plan.description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{plan.description}</Text> : null}

      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>{getDaysUntil(plan.due_date)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {doneCount}/{items.length || 0} done
        </Text>
      </View>

      <ProgressBar progress={progress} />

      <View style={styles.itemList}>
        {items.length > 0 ? (
          items
            .slice(0, 3)
            .map((item) => (
              <PlanItem
                key={item.id}
                title={item.title}
                completed={item.completed}
                onToggle={() => onToggleItem?.(item.id, !item.completed)}
              />
            ))
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No checklist items yet"
            description="Add items to keep this plan moving."
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
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
    fontSize: 12,
  },
  itemList: {
    marginTop: 12,
  },
  empty: {
    fontSize: 13,
  },
})
