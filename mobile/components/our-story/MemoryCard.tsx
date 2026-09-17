import {
  Cake,
  Gift,
  Handshake,
  Heart,
  HeartCrack,
  HeartHandshake,
  Laugh,
  MapPin,
  MessageCircle,
  NotebookPen,
  Palette,
  Plane,
  Repeat,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react-native'
import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { spacing, typography, useTheme } from '@/context/ThemeContext'
import type { RelationshipMemory } from '@/shared-types'

const icons: Record<string, LucideIcon> = {
  first_events: Sparkles,
  conflicts: HeartCrack,
  promises: Handshake,
  special_dates: Cake,
  emotional_expressions: Heart,
  physical_affection: HeartHandshake,
  locations: MapPin,
  inside_jokes_nicknames: Laugh,
  favorites: Star,
  routines: Repeat,
  personal_details: NotebookPen,
  gifts: Gift,
  future_plans: Target,
  travel: Plane,
  milestones: Trophy,
  social_circle: Users,
  shared_activities: Palette,
  vulnerable_moments: Heart,
}

export function formatMemoryDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function MemoryCard({ memory }: { memory: RelationshipMemory }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.accent1, shadowColor: colors.accent1 }]}>
      <View style={styles.header}>
        <View style={styles.identity}>
          {(() => {
            const Icon = icons[memory.category] ?? MessageCircle
            return <Icon color={colors.accent2} size={24} />
          })()}
          <View style={styles.flex}>
            <Text style={[styles.category, { color: colors.textPrimary }]} numberOfLines={1}>
              {memory.category.replace(/_/g, ' ')}
            </Text>
            <Text style={[styles.date, { color: colors.accent2 }]}>{formatMemoryDate(memory.date_time)}</Text>
          </View>
        </View>
        {memory.importance === 'critical' || memory.importance === 'high' ? (
          <Text style={[styles.badge, { backgroundColor: colors.surface, color: colors.accent2 }]}>{memory.importance}</Text>
        ) : null}
      </View>
      {memory.quote_burmese ? <Text style={[styles.quote, { color: colors.textPrimary }]}>{memory.quote_burmese}</Text> : null}
      {memory.context ? <Text style={[styles.context, { color: colors.textSecondary }]}>{memory.context}</Text> : null}
    </View>
  )
}

export default memo(MemoryCard)

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    opacity: 1,
    padding: spacing.xl,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 24 },
  flex: { flex: 1 },
  category: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.small,
    fontWeight: typography.weight.semibold,
    textTransform: 'capitalize',
  },
  date: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.caption,
    marginTop: spacing.xs,
  },
  badge: {
    borderRadius: 10,
    fontFamily: typography.fontFamily.sans,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  quote: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  context: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.small,
    lineHeight: typography.size.small * typography.lineHeight.normal,
  },
})
