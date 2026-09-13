import { useRouter } from 'expo-router'
import { BookHeart } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import { calculateDaysTogether } from '@/services/relationshipDays'

export default function OurStats({ coupleId }: { coupleId: string }) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171b22',
    borderColor: '#b88ae5',
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    padding: 24,
    shadowColor: '#b88ae5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: {
    color: '#d9bfd7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  link: { color: '#ffb5c3', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    backgroundColor: '#20242d',
    borderRadius: 12,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
  },
  label: { color: '#c4c4ce', fontSize: 12 },
  value: { color: '#f3f0f5', fontSize: 21, fontWeight: '700', marginTop: 4 },
  muted: { color: '#c4c4ce', fontSize: 13 },
  skeleton: { backgroundColor: '#171b22', borderRadius: 18, height: 150 },
})
