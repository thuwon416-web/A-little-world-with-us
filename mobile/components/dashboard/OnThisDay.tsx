import {
  BookHeart,
  Cake,
  Heart,
  HeartCrack,
  Handshake,
  MessageCircle,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'

const icons: Record<string, LucideIcon> = {
  first_events: Sparkles,
  conflicts: HeartCrack,
  promises: Handshake,
  special_dates: Cake,
  emotional_expressions: Heart,
  physical_affection: Heart,
  favorites: Star,
}

export default function OnThisDay({ coupleId }: { coupleId: string }) {
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    relationshipMemoriesService
      .getOnThisDay(coupleId, new Date())
      .then((data) => setMemories(data.slice(0, 3)))
      .catch(() => setMemories([]))
      .finally(() => setLoading(false))
  }, [coupleId])
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>On This Day</Text>
      {loading ? (
        <View style={styles.skeleton} />
      ) : memories.length === 0 ? (
        <EmptyState
          icon={BookHeart}
          title="No memories yet"
          description="No memories from this day yet. Add more shared moments to keep the timeline alive."
        />
      ) : (
        memories.map((memory) => (
          <View key={memory.id} style={styles.item}>
            <Text style={styles.meta}>
              {Math.max(1, new Date().getFullYear() - new Date(memory.date_time).getFullYear())}{' '}
              years ago today
            </Text>
            {(() => {
              const Icon = icons[memory.category] ?? MessageCircle
              return <Icon color="#ffb5c3" size={20} />
            })()}
            {memory.quote_burmese ? <Text style={styles.quote}>{memory.quote_burmese}</Text> : null}
            {memory.context ? <Text style={styles.muted}>{memory.context}</Text> : null}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171b22',
    borderColor: '#b88ae5',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 24,
    shadowColor: '#b88ae5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  kicker: {
    color: '#d9bfd7',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  item: { borderLeftColor: '#d8b9c8', borderLeftWidth: 2, gap: 4, paddingLeft: 10 },
  meta: { color: '#888', fontSize: 12 },
  icon: { fontSize: 20 },
  quote: { color: '#f3f0f5', fontSize: 15, lineHeight: 22 },
  muted: { color: '#c4c4ce', fontSize: 13, lineHeight: 20 },
  skeleton: { backgroundColor: '#2a2d35', borderRadius: 12, height: 72 },
})
