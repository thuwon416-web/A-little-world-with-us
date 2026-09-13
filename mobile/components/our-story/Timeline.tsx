import { BookHeart } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import MemoryCard from './MemoryCard'

import { EmptyState } from '@/components/ui/EmptyState'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { RelationshipMemory } from '@/shared-types'

const PAGE_SIZE = 50

export default function Timeline({ coupleId }: { coupleId: string }) {
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

  if (loading) return <Loading />
  if (error) return <Message text={error} onRetry={() => void load()} />
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
            <Chip label="All years" active={year === null} onPress={() => setYear(null)} />
            {years.map((item) => (
              <Chip
                key={item}
                label={String(item)}
                active={year === item}
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
        ListFooterComponent={loadingMore ? <Text style={styles.muted}>Loading more…</Text> : null}
      />
    </View>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  )
}
function Loading() {
  return (
    <View style={styles.list}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeleton} />
      ))}
    </View>
  )
}
function Message({ text, onRetry }: { text: string; onRetry?: () => void }) {
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

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  list: { gap: 14, paddingBottom: 24 },
  yearRow: { flexDirection: 'row', gap: 8, paddingBottom: 6 },
  chip: { backgroundColor: '#171b22', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#6b425e' },
  chipText: { color: '#f3f0f5', fontSize: 12 },
  group: { borderLeftColor: '#d8b9c8', borderLeftWidth: 1, paddingLeft: 12 },
  timelineLine: { flexDirection: 'row', gap: 8 },
  dot: { color: '#ff6b81', fontSize: 16, marginLeft: -19 },
  flex: { flex: 1, gap: 10 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  groupTitle: { color: '#f3f0f5', fontSize: 16, fontWeight: '700' },
  count: { color: '#c4c4ce' },
  muted: { color: '#c4c4ce', lineHeight: 22, textAlign: 'center' },
  message: { alignItems: 'center', gap: 12, padding: 28 },
  retry: { color: '#ffb5c3', fontWeight: '700' },
  skeleton: { backgroundColor: '#171b22', borderRadius: 18, height: 150 },
})
