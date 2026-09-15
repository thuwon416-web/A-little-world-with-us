import {
  BookHeart,
  Cake,
  Camera,
  Heart,
  HeartCrack,
  Handshake,
  MessageCircle,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { relationshipMemoriesService } from '@/services/relationship-memories'
import { getMemories } from '@/services/memories'
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

type UnifiedMemory = {
  source: 'photo' | 'chat'
  id: string
  title: string
  date: string
  yearsAgo: number
  imageUrl?: string
  quote?: string
  context?: string
  category?: string
}

export default function OnThisDay({ coupleId }: { coupleId: string }) {
  const { colors } = useTheme()
  const [memories, setMemories] = useState<UnifiedMemory[]>([])
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    const today = new Date()
    const load = async () => {
      const [chatResult, photoResult] = await Promise.allSettled([
        relationshipMemoriesService.getOnThisDay(coupleId, today),
        getMemories(),
      ])
      const chatItems: UnifiedMemory[] =
        chatResult.status === 'fulfilled'
          ? chatResult.value.map((memory: RelationshipMemory) => ({
              source: 'chat',
              id: memory.id,
              title: memory.category,
              date: memory.date_time,
              yearsAgo: Math.max(1, today.getFullYear() - new Date(memory.date_time).getFullYear()),
              quote: memory.quote_burmese ?? undefined,
              context: memory.context ?? undefined,
              category: memory.category,
            }))
          : []
      const photos = photoResult.status === 'fulfilled'
        ? photoResult.value.filter((memory) => {
            const date = new Date(memory.date)
            return date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
          })
        : []
      const resolvedPhotos = await Promise.all(photos.map(async (memory) => {
        const path = memory.storage_path ?? memory.image_url
        if (!path) return [memory.id, ''] as const
        if (path.startsWith('/') || path.startsWith('http')) return [memory.id, path] as const
        const { data } = await supabase.storage.from('memories').createSignedUrl(path, 3600)
        return [memory.id, data?.signedUrl ?? ''] as const
      }))
      const photoItems: UnifiedMemory[] = photos.map((memory) => ({
        source: 'photo',
        id: memory.id,
        title: memory.title ?? memory.caption ?? 'A memory together',
        date: memory.date,
        yearsAgo: Math.max(1, today.getFullYear() - new Date(memory.date).getFullYear()),
        imageUrl: resolvedPhotos.find(([id]) => id === memory.id)?.[1] || undefined,
        category: memory.category ?? undefined,
      }))
      if (mounted) {
        setImageUrls(Object.fromEntries(resolvedPhotos.filter(([, url]) => url)))
        setMemories([...chatItems, ...photoItems].sort((a, b) => b.yearsAgo - a.yearsAgo).slice(0, 3))
        setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [coupleId])
  return (
    <View style={styles.card}>
      <Text style={[styles.kicker, { color: colors.textSecondary }]}>On This Day</Text>
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
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {memory.yearsAgo}{' '}
              years ago today
            </Text>
            {(() => {
              const Icon = memory.source === 'photo' ? Camera : icons[memory.category ?? ''] ?? MessageCircle
              return <Icon color={colors.accent1} size={20} />
            })()}
            {memory.source === 'photo' ? (
              <View style={styles.photoRow}>
                {memory.imageUrl ? <Image source={{ uri: imageUrls[memory.id] ?? memory.imageUrl }} style={styles.thumbnail} /> : null}
                <Text style={[styles.quote, { color: colors.textPrimary }]}>{memory.title}</Text>
              </View>
            ) : memory.quote ? <Text style={[styles.quote, { color: colors.textPrimary }]}>{memory.quote}</Text> : null}
            {memory.context ? <Text style={[styles.muted, { color: colors.textSecondary }]}>{memory.context}</Text> : null}
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
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumbnail: { width: 56, height: 56, borderRadius: 12 },
})
