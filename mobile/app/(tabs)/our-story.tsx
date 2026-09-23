import { BookHeart, Heart, Layers, MessageCircle, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import AllMemories from '@/components/our-story/AllMemories'
import Categories from '@/components/our-story/Categories'
import TelegramArchive from '@/components/our-story/TelegramArchive'
import Timeline from '@/components/our-story/Timeline'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { haptics } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'

type Tab = 'timeline' | 'all' | 'categories' | 'telegram'

export default function OurStoryScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = createStyles(colors, sizes, insets.top)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('timeline')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('')
  useEffect(() => {
    void supabase.auth
      .getUser()
      .then(async ({ data, error: userError }) => {
        if (userError) throw userError
        if (!data.user) throw new Error('User not authenticated')
        const { data: link, error: linkError } = await supabase
          .from('couple_links')
          .select('couple_id')
          .or(`inviter_id.eq.${data.user.id},accepted_by.eq.${data.user.id}`)
          .eq('status', 'accepted')
          .maybeSingle()
        if (linkError) throw linkError
        setCoupleId(link?.couple_id ?? null)
      })
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : 'Unable to load your shared story.')
      )
      .finally(() => setLoading(false))
  }, [])
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BookHeart color={colors.accent1} size={25} />
        <View>
          <Text style={styles.title}>Our Story</Text>
          <Text style={styles.subtitle}>Every memory we&apos;ve made together</Text>
        </View>
      </View>
      {loading ? (
        <Text style={styles.muted}>Loading your story…</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !coupleId ? (
        <Text style={styles.muted}>Link with your partner to see your shared story.</Text>
      ) : (
        <View style={styles.content}>
          <View style={styles.tabs}>
            {(
              [
                ['timeline', 'Timeline', Sparkles],
                ['all', 'All Memories', Heart],
                ['categories', 'Categories', Layers],
                ['telegram', 'Telegram', MessageCircle],
              ] as const
            ).map(([value, label, Icon]) => (
              <TouchableOpacity
                key={value}
                onPress={() => {
                  haptics.light()
                  setTab(value)
                }}
                style={[styles.tab, tab === value && styles.tabActive]}
              >
                <Icon color={tab === value ? colors.accent1 : colors.textSecondary} size={16} />
                <Text style={styles.tabText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {tab === 'timeline' ? <Timeline coupleId={coupleId} /> : null}
          {tab === 'all' ? (
            <AllMemories coupleId={coupleId} initialCategory={category || 'all'} />
          ) : null}
          {tab === 'categories' ? (
            <Categories
              coupleId={coupleId}
              onOpenCategory={(value) => {
                setCategory(value)
                setTab('all')
              }}
            />
          ) : null}
          {tab === 'telegram' ? <TelegramArchive coupleId={coupleId} /> : null}
          {category ? (
            <Text style={styles.filterNote}>Category shortcut: {category.replace(/_/g, ' ')}</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes, paddingTop: number) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      padding: 20,
      paddingTop,
      gap: 18,
    },
    header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
    title: { color: colors.textPrimary, fontSize: sizes.text.hMd, fontWeight: '700' },
    subtitle: { color: colors.textSecondary, marginTop: 3 },
    content: { flex: 1, gap: 16 },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tab: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: sizes.radius.input,
    },
    tabActive: { backgroundColor: colors.surface },
    tabText: { color: colors.textPrimary, fontSize: sizes.text.xs },
    muted: { color: colors.textSecondary, padding: 24, textAlign: 'center' },
    error: { color: colors.error, padding: 24, textAlign: 'center' },
    filterNote: { color: colors.accent2, fontSize: sizes.text.xs },
  })
