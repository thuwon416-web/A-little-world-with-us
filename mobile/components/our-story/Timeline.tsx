import { BookHeart } from 'lucide-react-native'
import { memo, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import MemoryCard from './MemoryCard'

import { EmptyState } from '@/components/ui/EmptyState'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'
import { useTheme } from '@/context/ThemeContext'

const PAGE_SIZE = 50

function Timeline({ coupleId }: { coupleId: string }) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [year, setYear] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const load = async (more = false) => {
    if (more) setLoadingMore(true)
    else setLoading(true)
    try {
      const next = await relationshipMemoriesService.getHighlights(
        coupleId,
        more ? memories.length + PAGE_SIZE : PAGE_SIZE
      )
      setMemories(next)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load the timeline.')
    } finally {
      if (more) setLoadingMore(false)
      else setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [coupleId])

  const years = useMemo(
    () =>
      [...new Set(memories.map((item) => new Date(item.date_time).getFullYear()))].sort(
        (a, b) => b - a
      ),
    [memories]
  )
  const visible =
    year === null
      ? memories
      : memories.filter((item) => new Date(item.date_time).getFullYear() === year)
  const grouped = visible.reduce<Record<string, RelationshipMemory[]>>((result, item) => {
    const date = new Date(item.date_time)
    const key = `${date.getFullYear()} · ${date.toLocaleString('en-US', { month: 'long' })}`
    ;(result[key] ??= []).push(item)
    return result
  }, {})

  if (loading) return <Loading colors={colors} />
  if (error) return <Message text={error} colors={colors} onRetry={() => void load()} />
  if (!memories.length)
    return (
      <EmptyState
        icon={BookHeart}
        title="No memories yet"
        description="Upload Telegram data to get started."
      />
    )

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([key]) => key}
        ListHeaderComponent={
          <View style={styles.yearRow}>
            <Chip colors={colors} label="All years" active={year === null} onPress={() => setYear(null)} />
            {years.map((item) => (
              <Chip
                key={item}
                label={String(item)}
                active={year === item}
                colors={colors}
                onPress={() => setYear(item)}
              />
            ))}
          </View>
        }
        renderItem={({ item: [label, entries] }) => (
          <View style={styles.group}>
            <View style={styles.timelineLine}>
              <Text style={styles.dot}>●</Text>
              <View style={styles.flex}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{label}</Text>
                  <Text style={styles.count}>{entries.length}</Text>
                </View>
                {entries.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (!loadingMore && memories.length >= PAGE_SIZE) void load(true)
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListFooterComponent={loadingMore ? <Text style={styles.muted}>Loading more…</Text> : null}
      />
    </View>
  )
}

export default memo(Timeline)

function Chip({ colors, label, active, onPress }: { colors: ReturnType<typeof useTheme>['colors']; label: string; active: boolean; onPress: () => void }) {
  const styles = createStyles(colors)
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  )
}
function Loading({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const styles = createStyles(colors)
  return (
    <View style={styles.list}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeleton} />
      ))}
    </View>
  )
}
function Message({ colors, text, onRetry }: { colors: ReturnType<typeof useTheme>['colors']; text: string; onRetry?: () => void }) {
  const styles = createStyles(colors)
  return (
    <View style={styles.message}>
      <Text style={styles.muted}>{text}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  wrapper: { flex: 1 },
  list: { gap: 14, paddingBottom: 24 },
  yearRow: { flexDirection: 'row', gap: 8, paddingBottom: 6 },
  chip: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.accent2 },
  chipText: { color: colors.textPrimary, fontSize: 12 },
  group: { borderLeftColor: colors.accent2, borderLeftWidth: 1, paddingLeft: 12 },
  timelineLine: { flexDirection: 'row', gap: 8 },
  dot: { color: colors.accent1, fontSize: 16, marginLeft: -19 },
  flex: { flex: 1, gap: 10 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  groupTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  count: { color: colors.textSecondary },
  muted: { color: colors.textSecondary, lineHeight: 22, textAlign: 'center' },
  message: { alignItems: 'center', gap: 12, padding: 28 },
  retry: { color: colors.accent1, fontWeight: '700' },
  skeleton: { backgroundColor: colors.surface, borderRadius: 18, height: 150 },
})
