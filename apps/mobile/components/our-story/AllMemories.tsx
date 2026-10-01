import { BookHeart } from 'lucide-react-native'
import { memo, useEffect, useMemo, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import MemoryCard from './MemoryCard'

import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/context/ThemeContext'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import type { MemoryImportance, RelationshipMemory } from '@/shared-types'

const PAGE_SIZE = 15
const PREVIEW_SIZE = 5
const ROTATION_MS = 30_000

function AllMemories({
  coupleId,
  initialCategory = 'all',
}: Readonly<{
  coupleId: string
  initialCategory?: string
}>) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [memories, setMemories] = useState<RelationshipMemory[]>([])
  const [search, setSearch] = useState('')
  const [importance, setImportance] = useState<MemoryImportance | 'all'>('all')
  const [category, setCategory] = useState(initialCategory)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [error, setError] = useState('')

  const load = async (offset = 0) => {
    if (offset) setLoadingMore(true)
    else setLoading(true)
    try {
      const next = search.trim()
        ? await relationshipMemoriesService.search(coupleId, search.trim())
        : await relationshipMemoriesService.getByCouple(coupleId, { limit: PAGE_SIZE, offset })
      setMemories((current) => (offset && !search.trim() ? [...current, ...next] : next))
      setHasMore(!search.trim() && next.length === PAGE_SIZE)
      if (!offset) setRotation(0)
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to load memories.')
    } finally {
      if (offset) setLoadingMore(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250)
    return () => clearTimeout(timer)
  }, [coupleId, search])

  useEffect(() => {
    setShowAll(false)
    setRotation(0)
  }, [search, category, importance])

  const categories = useMemo(
    () => [...new Set(memories.map((item) => item.category))].sort((a, b) => a.localeCompare(b)),
    [memories]
  )
  const visible = useMemo(
    () =>
      memories.filter(
        (item) =>
          (importance === 'all' || item.importance === importance) &&
          (category === 'all' || item.category === category)
      ),
    [category, importance, memories]
  )
  const preview = useMemo(() => {
    if (showAll || visible.length <= PREVIEW_SIZE) return visible
    const start = (rotation * PREVIEW_SIZE) % visible.length
    return Array.from({ length: PREVIEW_SIZE }, (_, index) => visible[(start + index) % visible.length])
  }, [rotation, showAll, visible])

  useEffect(() => {
    if (showAll || visible.length <= PREVIEW_SIZE) return
    const timer = setInterval(() => setRotation((current) => current + 1), ROTATION_MS)
    return () => clearInterval(timer)
  }, [showAll, visible.length])

  if (loading)
    return (
      <View style={styles.message}>
        <Text style={styles.muted}>Loading memories…</Text>
      </View>
    )
  if (error)
    return (
      <View style={styles.message}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={() => void load()}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
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
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search Burmese or English…"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <View style={styles.filters}>
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setImportance(item)}
            style={[styles.chip, importance === item && styles.active]}
          >
            <Text style={styles.chipText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.filters}>
        {['all', ...categories].map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.chip, category === item && styles.active]}
          >
            <Text style={styles.chipText}>{item.replaceAll('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.previewHeader}>
        <Text style={styles.previewText}>Showing a rotating preview of {Math.min(PREVIEW_SIZE, visible.length)} memories</Text>
        <TouchableOpacity onPress={() => setShowAll((current) => !current)}>
          <Text style={styles.viewAll}>{showAll ? 'Show 5 preview' : 'View all memories'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={preview}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemoryCard memory={item} />}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (showAll && hasMore && !loadingMore) void load(memories.length)
        }}
        onEndReachedThreshold={0.5}
        removeClippedSubviews
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        ListFooterComponent={showAll && loadingMore ? <Text style={styles.muted}>Loading more…</Text> : null}
      />
    </View>
  )
}

export default memo(AllMemories)

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    wrapper: { flex: 1, gap: 12 },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      borderRadius: 14,
      borderWidth: 1,
      color: colors.textPrimary,
      padding: 13,
    },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: 15,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    active: { backgroundColor: colors.accent2 },
    chipText: { color: colors.textPrimary, textTransform: 'capitalize' },
    previewHeader: { gap: 6 },
    previewText: { color: colors.textPrimary, lineHeight: 22 },
    viewAll: { color: colors.accent1, fontWeight: '700' },
    list: { gap: 12, paddingBottom: 24 },
    muted: { color: colors.textSecondary, lineHeight: 22, textAlign: 'center' },
    message: { alignItems: 'center', gap: 12, padding: 28 },
    error: { color: colors.error, textAlign: 'center' },
    retry: { color: colors.accent1, fontWeight: '700' },
  })
