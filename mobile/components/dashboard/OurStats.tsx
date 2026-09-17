import { useRouter } from 'expo-router'
import { BookHeart } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import { calculateDaysTogether } from '@/services/relationshipDays'
import { useTheme } from '@/context/ThemeContext'

export default function OurStats({ coupleId }: { coupleId: string }) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const router = useRouter()
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    relationshipMemoriesService
      .getStats(coupleId)
      .then(setStats)
      .catch(() => setStats({}))
  }, [coupleId])
  if (stats === null) return <View style={styles.skeleton} />
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0)
  if (!total)
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>Our Stats</Text>
        <EmptyState
          icon={BookHeart}
          title="No stats yet"
          description="Upload memories to see how your story grows over time."
        />
      </View>
    )
  const cards = [
    ['Total Memories', total],
    ['Days Together', calculateDaysTogether()],
    ['Love Expressions', stats.emotional_expressions ?? 0],
    ['Promises', stats.promises ?? 0],
  ] as const
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Our Stats</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/our-story')}>
          <Text style={styles.link}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {cards.map(([label, value]) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.accent1,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    padding: 24,
    shadowColor: colors.accent1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: {
    color: colors.accent2,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  link: { color: colors.accent1, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  label: { color: colors.textSecondary, fontSize: 12 },
  value: { color: colors.textPrimary, fontSize: 21, fontWeight: '700', marginTop: 4 },
  muted: { color: colors.textSecondary, fontSize: 13 },
  skeleton: { backgroundColor: colors.surface, borderRadius: 18, height: 150 },
})
