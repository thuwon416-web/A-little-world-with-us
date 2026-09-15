import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Check, Sparkles, Wand2 } from 'lucide-react-native'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabase'
import { deleteMemory, getMemories, MemoryRecord } from '@/services/memories'
import MemorySlideshow from '@/components/memories/MemorySlideshow'
import SlideshowLaunchButton from '@/components/memories/SlideshowLaunchButton'

const categories = ['all', 'favorite', 'travel', 'ritual', 'journal'] as const

export default function MemoriesScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [filter, setFilter] = useState<(typeof categories)[number]>('all')
  const [error, setError] = useState('')
  const [mediatorMessage, setMediatorMessage] = useState('')
  const [mediatorResult, setMediatorResult] = useState('')
  const [mediatorError, setMediatorError] = useState('')
  const [mediatorLoading, setMediatorLoading] = useState(false)
  const [curationSelected, setCurationSelected] = useState<string[]>([])
  const [curationTheme, setCurationTheme] = useState('Our story')
  const [curationContext, setCurationContext] = useState('')
  const [curationStory, setCurationStory] = useState('')
  const [curationError, setCurationError] = useState('')
  const [curationLoading, setCurationLoading] = useState(false)
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false)
  useEffect(() => {
    void getMemories()
      .then(setMemories)
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : 'Unable to load memories.')
      )
  }, [])
  const visible = useMemo(
    () => (filter === 'all' ? memories : memories.filter((memory) => memory.category === filter)),
    [filter, memories]
  )
  const remove = (memory: MemoryRecord) =>
    Alert.alert('Delete memory?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void deleteMemory(memory.id)
            .then(() => setMemories((current) => current.filter((item) => item.id !== memory.id)))
            .catch((caught) =>
              setError(caught instanceof Error ? caught.message : 'Unable to delete memory.')
            ),
      },
    ])
  const createCuratedStory = async () => {
    if (!curationSelected.length || curationLoading) {
      if (!curationSelected.length) setCurationError('Choose at least one memory first.')
      return
    }
    setCurationLoading(true)
    setCurationError('')
    setCurationStory('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
      if (!webUrl || !session?.access_token) {
        throw new Error('Please sign in again.')
      }
      const response = await fetch(`${webUrl}/api/ai/curate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memoryIds: curationSelected,
          theme: curationTheme.trim() || 'Our story',
          context: curationContext.trim(),
        }),
      })
      const body = (await response.json()) as { story?: string; error?: string }
      if (!response.ok || !body.story) {
        throw new Error(body.error || 'Unable to create a story right now.')
      }
      setCurationStory(body.story)
    } catch (caught) {
      setCurationError(caught instanceof Error ? caught.message : 'Unable to create a story right now.')
    } finally {
      setCurationLoading(false)
    }
  }

  const askMediator = async () => {
    if (!mediatorMessage.trim() || mediatorLoading) return
    setMediatorLoading(true)
    setMediatorError('')
    setMediatorResult('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
      if (!webUrl || !session?.access_token) {
        throw new Error('Please sign in again.')
      }
      const response = await fetch(`${webUrl}/api/ai/mediate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: mediatorMessage.trim() }),
      })
      const body = (await response.json()) as { response?: string; error?: string }
      if (!response.ok || !body.response) {
        throw new Error(body.error || 'AI advice is unavailable.')
      }
      setMediatorResult(body.response)
    } catch (caught) {
      setMediatorError(caught instanceof Error ? caught.message : 'AI advice is unavailable.')
    } finally {
      setMediatorLoading(false)
    }
  }
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.eyebrow, { color: colors.accent2 }]}>Memories</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Our story</Text>
      <SlideshowLaunchButton memories={memories} onPress={() => setIsSlideshowOpen(true)} />
      <View style={[styles.mediatorCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.mediatorHeader}>
          <Sparkles color={colors.accent1} size={20} />
          <View style={styles.mediatorHeaderText}>
            <Text style={[styles.mediatorTitle, { color: colors.textPrimary }]}>Talk through a memory</Text>
            <Text style={[styles.mediatorDescription, { color: colors.textSecondary }]}>
              Choose a memory and ask for a gentle, two-sided reflection.
            </Text>
          </View>
        </View>
        <TextInput
          value={mediatorMessage}
          onChangeText={setMediatorMessage}
          maxLength={2000}
          multiline
          placeholder="What happened, and what would you like help understanding?"
          placeholderTextColor={colors.textSecondary}
          style={[styles.mediatorInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        />
        <View style={styles.mediatorActions}>
          <Text style={[styles.privacyNote, { color: colors.textSecondary }]}>
            Nothing is shared until you press Ask.
          </Text>
          <TouchableOpacity
            style={[styles.askButton, { backgroundColor: colors.accent1 }]}
            onPress={() => void askMediator()}
            disabled={!mediatorMessage.trim() || mediatorLoading}
          >
            <Text style={[styles.askButtonText, { color: colors.background }]}>
              {mediatorLoading ? 'Thinking…' : 'Ask mediator'}
            </Text>
          </TouchableOpacity>
        </View>
        {mediatorError ? <Text style={[styles.error, { color: colors.error }]}>{mediatorError}</Text> : null}
        {mediatorResult ? (
          <View style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.resultText, { color: colors.textPrimary }]}>{mediatorResult}</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.curationCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.mediatorHeader}>
          <Wand2 color={colors.accent2} size={20} />
          <View style={styles.mediatorHeaderText}>
            <Text style={[styles.mediatorTitle, { color: colors.textPrimary }]}>Memory curation</Text>
            <Text style={[styles.mediatorDescription, { color: colors.textSecondary }]}>
              Only the memories you select below are sent to the AI.
            </Text>
          </View>
        </View>
        <View style={styles.curationMemoryList}>
          {memories.length ? memories.map((memory) => {
            const isSelected = curationSelected.includes(memory.id)
            return (
              <TouchableOpacity
                key={memory.id}
                onPress={() =>
                  setCurationSelected((current) =>
                    isSelected
                      ? current.filter((id) => id !== memory.id)
                      : [...current, memory.id]
                  )
                }
                style={[styles.curationMemory, { backgroundColor: colors.surface }]}
              >
                <View style={[styles.checkbox, { borderColor: isSelected ? colors.accent1 : colors.cardBorder, backgroundColor: isSelected ? colors.accent1 : 'transparent' }]}>
                  {isSelected ? <Check color={colors.background} size={14} /> : null}
                </View>
                <Text style={[styles.curationMemoryTitle, { color: colors.textPrimary }]}>
                  {memory.title || memory.caption || 'A memory together'}
                </Text>
                <Text style={[styles.curationMemoryDate, { color: colors.textSecondary }]}>{memory.date}</Text>
              </TouchableOpacity>
            )
          }) : (
            <Text style={[styles.muted, { color: colors.textSecondary }]}>No memories available to curate.</Text>
          )}
        </View>
        <TextInput
          value={curationTheme}
          onChangeText={setCurationTheme}
          placeholder="Theme"
          placeholderTextColor={colors.textSecondary}
          style={[styles.curationInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        />
        <TextInput
          value={curationContext}
          onChangeText={setCurationContext}
          maxLength={500}
          multiline
          placeholder="Optional context (only what you choose to share)"
          placeholderTextColor={colors.textSecondary}
          style={[styles.curationInput, styles.curationContextInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        />
        <TouchableOpacity
          style={[styles.askButton, { backgroundColor: colors.accent1 }]}
          onPress={() => void createCuratedStory()}
          disabled={!memories.length || curationLoading}
        >
          <Text style={[styles.askButtonText, { color: colors.background }]}>
            {curationLoading ? 'Creating...' : 'Create story'}
          </Text>
        </TouchableOpacity>
        {curationError ? <Text style={[styles.error, { color: colors.error }]}>{curationError}</Text> : null}
        {curationStory ? (
          <View style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.resultText, { color: colors.textPrimary }]}>{curationStory}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={[styles.secondary, { backgroundColor: colors.success }]} onPress={() => router.push('/(tabs)/gallery')}>
        <Text style={[styles.secondaryText, { color: colors.background }]}>Open photo gallery</Text>
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setFilter(category)}
            style={[
              styles.filter,
              { backgroundColor: colors.cardBg },
              filter === category && { backgroundColor: colors.accent1 },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === category ? colors.background : colors.textPrimary }]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {visible.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>No structured memories in this category yet.</Text>
      ) : (
        visible.map((memory) => (
          <View key={memory.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.row}>
              <Text style={[styles.memoryTitle, { color: colors.textPrimary }]}>{memory.title}</Text>
              <TouchableOpacity onPress={() => remove(memory)}>
                <Text style={[styles.delete, { color: colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.meta, { color: colors.accent2 }]}>
              {memory.category} {memory.date ? `• ${memory.date}` : ''}
            </Text>
            {memory.caption ? <Text style={[styles.caption, { color: colors.textSecondary }]}>{memory.caption}</Text> : null}
          </View>
        ))
      )}
      {isSlideshowOpen ? <MemorySlideshow memories={memories} onClose={() => setIsSlideshowOpen(false)} /> : null}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 72, gap: 14 },
  eyebrow: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '700' },
  secondary: { borderRadius: 12, padding: 12, alignItems: 'center' },
  secondaryText: { fontWeight: '700' },
  filters: { gap: 8 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterText: { textTransform: 'capitalize' },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 7,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  memoryTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  meta: { textTransform: 'capitalize', fontSize: 12 },
  caption: { lineHeight: 21 },
  muted: {},
  error: {},
  delete: { fontWeight: '700' },
  mediatorCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  mediatorHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mediatorHeaderText: { flex: 1, gap: 4 },
  mediatorTitle: { fontSize: 17, fontWeight: '700' },
  mediatorDescription: { fontSize: 14, lineHeight: 20 },
  mediatorInput: { minHeight: 96, borderRadius: 14, borderWidth: 1, padding: 12, textAlignVertical: 'top' },
  mediatorActions: { gap: 10 },
  privacyNote: { fontSize: 12 },
  askButton: { alignSelf: 'flex-end', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  askButtonText: { fontWeight: '700' },
  result: { borderRadius: 14, borderWidth: 1, padding: 14 },
  resultText: { fontSize: 14, lineHeight: 22 },
  curationCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  curationMemoryList: { gap: 8, maxHeight: 192 },
  curationMemory: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  curationMemoryTitle: { flex: 1, fontSize: 14 },
  curationMemoryDate: { fontSize: 11 },
  curationInput: { minHeight: 44, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  curationContextInput: { minHeight: 80, textAlignVertical: 'top' },
})
