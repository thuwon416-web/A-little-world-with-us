import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Audio } from 'expo-av'
import * as Speech from 'expo-speech'
import { Check, Frown, Heart, Meh, Mic, Pause, Pencil, Play, Smile, Sparkles, Square, Trash2, TriangleAlert, Volume2, Wand2 } from 'lucide-react-native'
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'
import { deleteMemory, getMemories, MemoryRecord } from '@/services/memories'
import MemorySlideshow from '@/components/memories/MemorySlideshow'
import SlideshowLaunchButton from '@/components/memories/SlideshowLaunchButton'

const categories = ['all', 'favorite', 'travel', 'ritual', 'journal'] as const
type JournalMood = 'happy' | 'okay' | 'sad' | 'loved' | 'anxious'
type JournalMemory = MemoryRecord & {
  description?: string | null
  metadata?: { mood_tag?: string; ai_reflection?: string; voice_url?: string } | null
}
const JOURNAL_MOODS: { id: JournalMood; label: string; Icon: typeof Smile }[] = [
  { id: 'happy', label: 'Happy', Icon: Smile },
  { id: 'okay', label: 'Okay', Icon: Meh },
  { id: 'sad', label: 'Sad', Icon: Frown },
  { id: 'loved', label: 'Loved', Icon: Heart },
  { id: 'anxious', label: 'Anxious', Icon: TriangleAlert },
]

export default function MemoriesScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [memories, setMemories] = useState<JournalMemory[]>([])
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
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null)
  const [journalTitle, setJournalTitle] = useState('')
  const [journalBody, setJournalBody] = useState('')
  const [journalMood, setJournalMood] = useState<JournalMood>('okay')
  const [journalSaving, setJournalSaving] = useState(false)
  const [reflectingId, setReflectingId] = useState<string | null>(null)
  const [journalRecording, setJournalRecording] = useState<Audio.Recording | null>(null)
  const [journalVoiceUri, setJournalVoiceUri] = useState<string | null>(null)
  const [journalVoiceRemoteUrl, setJournalVoiceRemoteUrl] = useState<string | null>(null)
  const [journalRecordingTime, setJournalRecordingTime] = useState(0)
  const [journalPlaying, setJournalPlaying] = useState(false)
  const [journalSound, setJournalSound] = useState<Audio.Sound | null>(null)
  const [journalUploadingVoice, setJournalUploadingVoice] = useState(false)
  const [speakingJournalId, setSpeakingJournalId] = useState<string | null>(null)

  const loadMemories = async () => {
    const records = await getMemories()
    if (!records.length) return records
    const { data, error: detailsError } = await supabase
      .from('memories')
      .select('id,description,metadata')
      .in('id', records.map((memory) => memory.id))
    if (detailsError) throw new Error(detailsError.message)
    const details = new Map(
      (data ?? []).map((item) => [
        item.id,
        {
          description: item.description,
          metadata: item.metadata as { mood_tag?: string } | null,
        },
      ])
    )
    return records.map((memory) => ({ ...memory, ...(details.get(memory.id) ?? {}) }))
  }

  useEffect(() => {
    void loadMemories()
      .then(setMemories)
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : 'Unable to load memories.')
      )
  }, [])
  useEffect(() => () => {
    if (journalRecording) void journalRecording.stopAndUnloadAsync()
    if (journalSound) void journalSound.unloadAsync()
    void Speech.stop()
  }, [journalRecording, journalSound])
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
  const openNewJournal = () => {
    if (journalSound) void journalSound.unloadAsync()
    setEditingJournalId(null)
    setJournalTitle('')
    setJournalBody('')
    setJournalMood('okay')
    setJournalRecording(null)
    setJournalVoiceUri(null)
    setJournalVoiceRemoteUrl(null)
    setJournalRecordingTime(0)
    setJournalPlaying(false)
    setJournalSound(null)
    setJournalModalOpen(true)
  }
  const openEditJournal = (memory: JournalMemory) => {
    setEditingJournalId(memory.id)
    setJournalTitle(memory.title)
    setJournalBody(memory.description ?? '')
    setJournalVoiceRemoteUrl(memory.metadata?.voice_url ?? null)
    setJournalVoiceUri(null)
    setJournalRecording(null)
    setJournalRecordingTime(0)
    setJournalPlaying(false)
    const tag = memory.metadata?.mood_tag
    setJournalMood(JOURNAL_MOODS.some((mood) => mood.id === tag) ? (tag as JournalMood) : 'okay')
    setJournalModalOpen(true)
  }
  const closeJournalModal = () => {
    if (journalRecording) void journalRecording.stopAndUnloadAsync()
    if (journalSound) void journalSound.unloadAsync()
    setJournalModalOpen(false)
    setEditingJournalId(null)
    setJournalTitle('')
    setJournalBody('')
    setJournalMood('okay')
    setJournalRecording(null)
    setJournalVoiceUri(null)
    setJournalVoiceRemoteUrl(null)
    setJournalRecordingTime(0)
    setJournalPlaying(false)
    setJournalSound(null)
  }
  const startJournalRecording = async () => {
    const permission = await Audio.requestPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow microphone access to record a voice note.')
      return
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
    const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
    result.recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording) setJournalRecordingTime(Math.floor(status.durationMillis / 1000))
    })
    setJournalRecording(result.recording)
    setJournalRecordingTime(0)
    setJournalVoiceUri(null)
    setJournalVoiceRemoteUrl(null)
  }
  const stopJournalRecording = async () => {
    if (!journalRecording) return
    await journalRecording.stopAndUnloadAsync()
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
    const uri = journalRecording.getURI()
    setJournalVoiceUri(uri ?? null)
    setJournalRecording(null)
  }
  const discardJournalVoice = async () => {
    if (journalRecording) {
      try {
        await journalRecording.stopAndUnloadAsync()
      } catch {
        // The recording may already be unloaded after stopping.
      }
    }
    if (journalSound) await journalSound.unloadAsync()
    setJournalRecording(null)
    setJournalVoiceUri(null)
    setJournalVoiceRemoteUrl(null)
    setJournalRecordingTime(0)
    setJournalPlaying(false)
    setJournalSound(null)
  }
  const playJournalVoice = async (source?: string) => {
    const uri = source ?? journalVoiceUri ?? journalVoiceRemoteUrl
    if (!uri) return
    if (journalPlaying && journalSound) {
      await journalSound.stopAsync()
      await journalSound.unloadAsync()
      setJournalSound(null)
      setJournalPlaying(false)
      return
    }
    const { sound } = await Audio.Sound.createAsync({ uri })
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync()
        setJournalSound(null)
        setJournalPlaying(false)
      }
    })
    setJournalSound(sound)
    setJournalPlaying(true)
    await sound.playAsync()
  }
  const saveJournal = async () => {
    if (!journalTitle.trim() || journalSaving) return
    setJournalSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in again.')
      const { data: coupleLink, error: coupleError } = await supabase
        .from('couple_links')
        .select('couple_id')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()
      if (coupleError || !coupleLink?.couple_id) {
        throw new Error(coupleError?.message || 'No accepted couple is linked to this account.')
      }
      let voiceUrl = journalVoiceRemoteUrl
      if (journalVoiceUri && !journalVoiceRemoteUrl) {
        setJournalUploadingVoice(true)
        const filePath = `journal/${coupleLink.couple_id}/${Date.now()}.m4a`
        const arraybuffer = await fetch(journalVoiceUri).then((response) => response.arrayBuffer())
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(filePath, arraybuffer, { contentType: 'audio/m4a', upsert: false })
        if (uploadError) throw new Error(`Voice upload failed: ${uploadError.message}`)
        const { data: urlData } = await supabase.storage.from('memories').createSignedUrl(filePath, 3600)
        if (!urlData?.signedUrl) {
          throw new Error('Failed to generate signed URL for voice memo')
        }
        voiceUrl = urlData.signedUrl
        setJournalVoiceRemoteUrl(voiceUrl)
      }
      const existingMeta = editingJournalId
        ? memories.find((memory) => memory.id === editingJournalId)?.metadata ?? {}
        : {}
      const payload = {
        couple_id: coupleLink.couple_id,
        user_id: user.id,
        title: journalTitle.trim(),
        description: journalBody.trim() || null,
        category: 'journal' as const,
        date: new Date().toISOString().slice(0, 10),
        metadata: { ...existingMeta, mood_tag: journalMood, ...(voiceUrl ? { voice_url: voiceUrl } : {}) },
      }
      const query = editingJournalId
        ? supabase.from('memories').update(payload).eq('id', editingJournalId).select().single()
        : supabase.from('memories').insert(payload).select().single()
      const { data, error: saveError } = await query
      if (saveError) throw new Error(saveError.message)
      const saved = data as JournalMemory
      setMemories((current) =>
        editingJournalId
          ? current.map((memory) => (memory.id === editingJournalId ? { ...memory, ...saved } : memory))
          : [saved, ...current]
      )
      closeJournalModal()
    } catch (caught) {
      Alert.alert('Unable to save journal', caught instanceof Error ? caught.message : 'Unable to save journal.')
    } finally {
      setJournalUploadingVoice(false)
      setJournalSaving(false)
    }
  }
  const requestReflection = async (memory: JournalMemory) => {
    if (reflectingId) return
    setReflectingId(memory.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
      if (!webUrl || !session?.access_token) throw new Error('Please sign in again.')
      const response = await fetch(`${webUrl}/api/ai/journal-reflect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ journal_id: memory.id }),
      })
      const body = (await response.json()) as { reflection?: string; error?: string }
      if (!response.ok || !body.reflection) throw new Error(body.error || 'Reflection failed.')
      setMemories((current) => current.map((item) =>
        item.id === memory.id
          ? { ...item, metadata: { ...(item.metadata ?? {}), ai_reflection: body.reflection } }
          : item
      ))
    } catch (caught) {
      Alert.alert('AI reflection', caught instanceof Error ? caught.message : 'Unable to reflect right now.')
    } finally {
      setReflectingId(null)
    }
  }
  const speakReflection = async (memory: JournalMemory) => {
    const text = memory.metadata?.ai_reflection
    if (!text) return
    try {
      if (speakingJournalId === memory.id) {
        await Speech.stop()
        setSpeakingJournalId(null)
        return
      }
      await Speech.stop()
      setSpeakingJournalId(memory.id)
      Speech.speak(text, {
        language: /[\uAC00-\uD7AF]/.test(text) ? 'ko-KR' : 'en-US',
        onDone: () => setSpeakingJournalId(null),
        onStopped: () => setSpeakingJournalId(null),
        onError: () => setSpeakingJournalId(null),
      })
    } catch {
      setSpeakingJournalId(null)
    }
  }
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
      {filter === 'journal' ? (
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.accent1 }]} onPress={openNewJournal}>
          <Text style={[styles.primaryButtonText, { color: colors.background }]}>New journal entry</Text>
        </TouchableOpacity>
      ) : null}
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {visible.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>No structured memories in this category yet.</Text>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item: memory }) => (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.row}>
                <Text style={[styles.memoryTitle, { color: colors.textPrimary }]}>{memory.title}</Text>
                {memory.category === 'journal' ? (
                  <View style={styles.journalActions}>
                    {memory.metadata?.mood_tag ? (() => {
                      const mood = JOURNAL_MOODS.find((item) => item.id === memory.metadata?.mood_tag) ??
                        JOURNAL_MOODS.find((item) => item.id === 'okay')
                      if (!mood) return null
                      const MoodIcon = mood.Icon
                      return <MoodIcon color={colors.accent2} size={20} />
                    })() : null}
                    <TouchableOpacity onPress={() => openEditJournal(memory)} accessibilityLabel="Edit journal entry">
                      <Pencil color={colors.accent2} size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => remove(memory)} accessibilityLabel="Delete journal entry">
                      <Trash2 color={colors.error} size={20} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => remove(memory)}>
                    <Text style={[styles.delete, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.meta, { color: colors.accent2 }]}>
                {memory.category} {memory.date ? `• ${memory.date}` : ''}
              </Text>
              {memory.caption ? <Text style={[styles.caption, { color: colors.textSecondary }]}>{memory.caption}</Text> : null}
              {memory.category === 'journal' && memory.description ? (
                <Text style={[styles.caption, { color: colors.textSecondary }]} numberOfLines={2}>{memory.description}</Text>
              ) : null}
              {memory.category === 'journal' ? (
                memory.metadata?.ai_reflection ? (
                  <View style={[styles.reflectionCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <View style={styles.reflectionHeader}>
                      <Sparkles color={colors.accent1} size={16} />
                      <Text style={[styles.reflectionLabel, { color: colors.accent1 }]}>AI reflection</Text>
                      <TouchableOpacity onPress={() => void speakReflection(memory)} accessibilityLabel="Read AI reflection aloud">
                        {speakingJournalId === memory.id
                          ? <Square color={colors.accent1} size={16} />
                          : <Volume2 color={colors.accent1} size={16} />}
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.caption, { color: colors.textPrimary }]}>{memory.metadata.ai_reflection}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.reflectButton, { borderColor: colors.cardBorder }]}
                    onPress={() => void requestReflection(memory)}
                    disabled={reflectingId !== null}
                  >
                    {reflectingId === memory.id ? <ActivityIndicator color={colors.accent1} size="small" /> : <Sparkles color={colors.accent1} size={16} />}
                    <Text style={[styles.reflectButtonText, { color: colors.accent1 }]}>
                      {reflectingId === memory.id ? 'Reflecting...' : 'Reflect with AI'}
                    </Text>
                  </TouchableOpacity>
                )
              ) : null}
              {memory.category === 'journal' && memory.metadata?.voice_url ? (
                <TouchableOpacity
                  style={[styles.voiceRow, { borderColor: colors.cardBorder }]}
                  onPress={() => void playJournalVoice(memory.metadata?.voice_url)}
                >
                  <Play color={colors.accent1} size={16} />
                  <Text style={[styles.reflectButtonText, { color: colors.accent1 }]}>Play voice note</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
        />
      )}
      <Modal
        visible={journalModalOpen}
        onClose={closeJournalModal}
        title={editingJournalId ? 'Edit journal entry' : 'New journal entry'}
      >
        <TextInput
          value={journalTitle}
          onChangeText={setJournalTitle}
          placeholder="Title"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        />
        <TextInput
          value={journalBody}
          onChangeText={setJournalBody}
          placeholder="Write your thoughts..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={5}
          style={[styles.input, styles.textArea, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        />
        <Text style={[styles.label, { color: colors.textPrimary }]}>Voice note (optional)</Text>
        {journalRecording ? (
          <View style={[styles.voiceRow, { borderColor: colors.cardBorder }]}>
            <Text style={{ color: colors.textPrimary }}>{journalRecordingTime}s</Text>
            <TouchableOpacity onPress={() => void stopJournalRecording()}>
              <Square color={colors.error} size={20} />
            </TouchableOpacity>
          </View>
        ) : (journalVoiceUri || journalVoiceRemoteUrl) ? (
          <View style={[styles.voiceRow, { borderColor: colors.cardBorder }]}>
            <TouchableOpacity onPress={() => void playJournalVoice()}>
              {journalPlaying ? <Pause color={colors.accent1} size={20} /> : <Play color={colors.accent1} size={20} />}
            </TouchableOpacity>
            <Text style={[styles.voiceText, { color: colors.textPrimary }]}>
              {journalPlaying ? 'Playing...' : journalUploadingVoice ? 'Uploading...' : 'Voice attached'}
            </Text>
            <TouchableOpacity onPress={() => void discardJournalVoice()}>
              <Trash2 color={colors.error} size={20} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.voiceRow, { borderColor: colors.cardBorder }]} onPress={() => void startJournalRecording()}>
            <Mic color={colors.accent1} size={20} />
            <Text style={[styles.voiceText, { color: colors.accent1 }]}>Record voice note</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.label, { color: colors.textPrimary }]}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {JOURNAL_MOODS.map(({ id, label, Icon }) => {
            const selected = journalMood === id
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setJournalMood(id)}
                style={[styles.moodChip, { borderColor: colors.cardBorder }, selected && { backgroundColor: colors.accent1, borderColor: colors.accent1 }]}
              >
                <Icon color={selected ? colors.background : colors.textSecondary} size={20} />
                <Text style={[styles.moodLabel, { color: colors.textSecondary }, selected && { color: colors.background }]}>{label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity onPress={closeJournalModal}>
            <Text style={{ color: colors.textSecondary }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void saveJournal()} disabled={journalSaving || !journalTitle.trim()}>
            <Text style={{ color: colors.accent1 }}>{journalSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {isSlideshowOpen ? <MemorySlideshow memories={memories} onClose={() => setIsSlideshowOpen(false)} /> : null}
    </ScrollView>
  )
}
const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: { flexGrow: 1, padding: 20, paddingTop: 72, gap: 14 },
    eyebrow: { fontSize: sizes.text.xs, letterSpacing: 2, textTransform: 'uppercase' },
    title: { fontSize: sizes.text.hLg, fontWeight: '700' },
    secondary: { borderRadius: sizes.radius.input, padding: 12, alignItems: 'center' },
    secondaryText: { fontWeight: '700' },
    filters: { gap: 8 },
    filter: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: sizes.radius.btn,
    },
    filterText: { textTransform: 'capitalize' },
    card: {
      borderRadius: sizes.radius.card,
      borderWidth: 1,
      padding: 16,
      gap: 7,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    memoryTitle: { fontSize: sizes.text.bodyLg, fontWeight: '700', flex: 1 },
    meta: { textTransform: 'capitalize', fontSize: sizes.text.xs },
    caption: { lineHeight: 21 },
    muted: {},
    error: {},
    delete: { fontWeight: '700' },
    journalActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    primaryButton: { borderRadius: sizes.radius.input, padding: 12, alignItems: 'center' },
    primaryButtonText: { fontWeight: '700' },
    input: { minHeight: 44, borderRadius: sizes.radius.input, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    label: { fontWeight: '700' },
    moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    moodChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: sizes.radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
    moodLabel: { fontSize: sizes.text.xs },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 14 },
    reflectionCard: { borderRadius: sizes.radius.input, borderWidth: 1, padding: 12, gap: 8 },
    reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    reflectionLabel: { fontSize: sizes.text.xs, fontWeight: '700' },
    reflectButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderRadius: sizes.radius.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
    reflectButtonText: { fontSize: sizes.text.xs, fontWeight: '700' },
    voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: sizes.radius.input, borderWidth: 1, padding: 10 },
    voiceText: { flex: 1, fontSize: sizes.text.sm },
    mediatorCard: { borderRadius: sizes.radius.card, borderWidth: 1, padding: 16, gap: 12 },
    mediatorHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    mediatorHeaderText: { flex: 1, gap: 4 },
    mediatorTitle: { fontSize: sizes.text.bodyLg, fontWeight: '700' },
    mediatorDescription: { fontSize: sizes.text.sm, lineHeight: 20 },
    mediatorInput: { minHeight: 96, borderRadius: sizes.radius.btn, borderWidth: 1, padding: 12, textAlignVertical: 'top' },
    mediatorActions: { gap: 10 },
    privacyNote: { fontSize: sizes.text.xs },
    askButton: { alignSelf: 'flex-end', borderRadius: sizes.radius.pill, paddingHorizontal: 16, paddingVertical: 10 },
    askButtonText: { fontWeight: '700' },
    result: { borderRadius: sizes.radius.btn, borderWidth: 1, padding: 14 },
    resultText: { fontSize: sizes.text.sm, lineHeight: 22 },
    curationCard: { borderRadius: sizes.radius.card, borderWidth: 1, padding: 16, gap: 12 },
    curationMemoryList: { gap: 8, maxHeight: 192 },
    curationMemory: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: sizes.radius.input, padding: 10 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    curationMemoryTitle: { flex: 1, fontSize: sizes.text.sm },
    curationMemoryDate: { fontSize: sizes.text.xs },
    curationInput: { minHeight: 44, borderRadius: sizes.radius.btn, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
    curationContextInput: { minHeight: 80, textAlignVertical: 'top' },
  })
