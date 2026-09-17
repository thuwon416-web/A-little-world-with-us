import {
  BookHeart,
  Cake,
  HeartCrack,
  HeartHandshake,
  Handshake,
  MessageCircle,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react-native'
import { memo, useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import MemoryCard from './MemoryCard'

import { EmptyState } from '@/components/ui/EmptyState'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'
import { useTheme } from '@/context/ThemeContext'

const icons: Record<string, LucideIcon> = {
  promises: Handshake,
  physical_affection: HeartHandshake,
  conflicts: HeartCrack,
  favorites: Star,
  special_dates: Cake,
  first_events: Sparkles,
}

function Categories({
  coupleId,
  onOpenCategory,
}: {
  coupleId: string
  onOpenCategory: (category: string) => void
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    relationshipMemoriesService
      .getStats(coupleId)
      .then(setStats)
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : 'Unable to load categories.')
      )
      .finally(() => setLoading(false))
  }, [coupleId])
  const toggle = async (category: string) => {
    if (expanded === category) {
      setExpanded(null)
      return
    }
    setExpanded(category)
    try {
      setMemories((await relationshipMemoriesService.getByCategory(coupleId, category)).slice(0, 5))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load category memories.')
    }
  }
  if (loading) return <Text style={styles.muted}>Loading categories…</Text>
  if (error) return <Text style={styles.error}>{error}</Text>
  if (!Object.keys(stats).length)
    return (
      <EmptyState
        icon={BookHeart}
        title="No memories yet"
        description="Upload Telegram data to get started."
      />
    )

  const entries = Object.entries(stats).sort(([, a], [, b]) => b - a)
  return (
    <FlatList
      data={entries}
      numColumns={2}
      keyExtractor={([category]) => category}
      removeClippedSubviews
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      renderItem={({ item: [category, count] }) => (
        <View style={styles.card}>
          <TouchableOpacity onPress={() => void toggle(category)} style={styles.category}>
            {(() => {
              const Icon = icons[category] ?? MessageCircle
              return <Icon color={colors.accent1} size={28} />
            })()}
            <Text style={styles.name}>{category.replace(/_/g, ' ')}</Text>
            <Text style={styles.count}>{count}</Text>
          </TouchableOpacity>
          {expanded === category ? (
            <View style={styles.expanded}>
              {memories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
              <TouchableOpacity onPress={() => onOpenCategory(category)}>
                <Text style={styles.link}>View all in this category</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    />
  )
}

export default memo(Categories)

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  grid: { gap: 12, paddingBottom: 24 },
  row: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  category: { alignItems: 'center', gap: 8, minHeight: 105, justifyContent: 'center' },
  icon: { fontSize: 28 },
  name: { color: colors.textPrimary, fontSize: 13, textAlign: 'center', textTransform: 'capitalize' },
  count: { color: colors.accent2, fontWeight: '700' },
  expanded: { gap: 8, width: 320 },
  link: { color: colors.accent1, fontSize: 12 },
  muted: { color: colors.textSecondary, padding: 28, textAlign: 'center' },
  error: { color: colors.error, padding: 20, textAlign: 'center' },
})
