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
import { StyleSheet, Text, View } from 'react-native'

import { spacing, typography } from '@/context/ThemeContext'
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

export default function MemoryCard({ memory }: { memory: RelationshipMemory }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.identity}>
          {(() => {
            const Icon = icons[memory.category] ?? MessageCircle
            return <Icon color="#ffb5c3" size={24} />
          })()}
          <View style={styles.flex}>
            <Text style={styles.category} numberOfLines={1}>
              {memory.category.replace(/_/g, ' ')}
            </Text>
            <Text style={styles.date}>{formatMemoryDate(memory.date_time)}</Text>
          </View>
        </View>
        {memory.importance === 'critical' || memory.importance === 'high' ? (
          <Text style={styles.badge}>{memory.importance}</Text>
        ) : null}
      </View>
      {memory.quote_burmese ? <Text style={styles.quote}>{memory.quote_burmese}</Text> : null}
      {memory.context ? <Text style={styles.context}>{memory.context}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171b22',
    borderColor: '#b88ae5',
    borderRadius: 16,
    borderWidth: 1,
    opacity: 1,
    padding: spacing.xl,
    gap: spacing.sm,
    shadowColor: '#b88ae5',
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
    color: '#f3f0f5',
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.small,
    fontWeight: typography.weight.semibold,
    textTransform: 'capitalize',
  },
  date: {
    color: '#d9bfd7',
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.caption,
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: '#442d40',
    borderRadius: 10,
    color: '#ffb5c3',
    fontFamily: typography.fontFamily.sans,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  quote: {
    color: '#f3f0f5',
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.body,
    lineHeight: typography.size.body * typography.lineHeight.normal,
  },
  context: {
    color: '#c4c4ce',
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.small,
    lineHeight: typography.size.small * typography.lineHeight.normal,
  },
})
