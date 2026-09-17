import { BookHeart, Heart, Layers, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import AllMemories from '@/components/our-story/AllMemories'
import Categories from '@/components/our-story/Categories'
import Timeline from '@/components/our-story/Timeline'
import { haptics } from '@/lib/haptics'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/context/ThemeContext'

type Tab = 'timeline' | 'all' | 'categories'

export default function OurStoryScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors)
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
          {category ? (
            <Text style={styles.filterNote}>Category shortcut: {category.replace(/_/g, ' ')}</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 20, paddingTop: 72, gap: 18 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, marginTop: 3 },
  content: { flex: 1, gap: 16 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  tabActive: { backgroundColor: colors.surface },
  tabText: { color: colors.textPrimary, fontSize: 12 },
  muted: { color: colors.textSecondary, padding: 24, textAlign: 'center' },
  error: { color: colors.error, padding: 24, textAlign: 'center' },
  filterNote: { color: colors.accent2, fontSize: 12 },
})
