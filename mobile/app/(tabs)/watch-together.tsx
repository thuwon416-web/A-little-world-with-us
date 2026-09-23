import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import YouTube from 'react-native-youtube-iframe'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import {
  addWatchHistory,
  addWatchlistItem,
  extractYouTubeId,
  getWatchContext,
  getWatchlist,
  removeWatchlistItem,
  sendWatchSync,
  subscribeToWatchSync,
  type WatchlistItem,
} from '@/services/watchTogether'

export default function WatchTogetherScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [current, setCurrent] = useState<WatchlistItem | null>(null)
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const latestSyncTimestamp = useRef(0)

  useEffect(() => {
    let dispose: (() => void) | undefined
    void getWatchContext()
      .then(async (context) => {
        setCoupleId(context.coupleId)
        setUserId(context.user.id)
        const loaded = await getWatchlist(context.coupleId as string)
        setItems(loaded)
        setCurrent(loaded[0] ?? null)
        dispose = subscribeToWatchSync(context.coupleId as string, (event, payload) => {
          const timestamp = Number(payload.timestamp) || 0
          if (timestamp <= latestSyncTimestamp.current) return
          latestSyncTimestamp.current = timestamp
          if (event === 'video' && payload.youtubeId)
            setCurrent(loaded.find((item) => item.youtube_id === payload.youtubeId) ?? null)
          if (event === 'play') setPlaying(true)
          if (event === 'pause') setPlaying(false)
          if (event === 'seek' && payload.position !== undefined) setPosition(payload.position)
        })
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Unable to load Watch Together.')
      )
    return () => dispose?.()
  }, [])

  const selectVideo = async (item: WatchlistItem) => {
    setCurrent(item)
    setPlaying(false)
    if (coupleId) await sendWatchSync(coupleId, 'video', { youtubeId: item.youtube_id })
    if (coupleId && userId) await addWatchHistory(coupleId, userId, item.youtube_id)
  }
  const add = async () => {
    const id = extractYouTubeId(input)
    if (!id || !coupleId || !userId) {
      setError('Enter a valid YouTube URL or 11-character video ID.')
      return
    }
    try {
      const item = await addWatchlistItem(coupleId, userId, id, title)
      setItems((old) => [...old, item])
      setCurrent((old) => old ?? item)
      setInput('')
      setTitle('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add video.')
    }
  }
  const toggle = async () => {
    const next = !playing
    setPlaying(next)
    if (coupleId) await sendWatchSync(coupleId, next ? 'play' : 'pause', { position })
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Watch Together</Text>
      <Text style={styles.title}>A shared screen for your next story</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      {current ? (
        <View style={styles.player}>
          <YouTube
            height={220}
            videoId={current.youtube_id}
            play={playing}
            onChangeState={(state) => {
              if (state === 'playing') setPlaying(true)
              if (state === 'paused') setPlaying(false)
            }}
          />
          <Text style={styles.now}>{current.title}</Text>
          <TouchableOpacity style={styles.button} onPress={() => void toggle()}>
            <Text style={styles.buttonText}>{playing ? 'Pause' : 'Play'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.muted}>Add a video to start your watch party.</Text>
      )}
      <View style={styles.card}>
        <Text style={styles.section}>Add to watchlist</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="YouTube URL or video ID"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={() => void add()}>
          <Text style={styles.buttonText}>Add video</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.section}>Watchlist</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <Image source={{ uri: item.thumbnail_url ?? undefined }} style={styles.thumb} />
          <TouchableOpacity style={styles.itemText} onPress={() => void selectVideo(item)}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.muted}>Play together</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Remove video?', item.title, [
                { text: 'Cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () =>
                    void removeWatchlistItem(item.id).then(() =>
                      setItems((old) => old.filter((row) => row.id !== item.id))
                    ),
                },
              ])
            }
          >
            <Text style={styles.remove}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.chatLink} onPress={() => router.push('/chat')}>
        <Text style={styles.buttonText}>Open party chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => void Linking.openURL('https://support.google.com/youtube/answer/171780')}
      >
        <Text style={styles.muted}>YouTube playback help</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      padding: 20,
      paddingTop: 72,
      gap: 14,
    },
    eyebrow: {
      color: colors.accent2,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontSize: sizes.text.xs,
    },
    title: { color: colors.textPrimary, fontSize: sizes.text.hLg, fontWeight: '700' },
    player: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      overflow: 'hidden',
      paddingBottom: 14,
    },
    now: { color: colors.textPrimary, fontWeight: '700', padding: 14 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 16,
      gap: 10,
    },
    section: { color: colors.textPrimary, fontSize: sizes.text.hSm, fontWeight: '700' },
    input: {
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: sizes.radius.input,
      padding: 12,
    },
    button: {
      backgroundColor: colors.accent1,
      borderRadius: sizes.radius.input,
      padding: 12,
      alignItems: 'center',
    },
    buttonText: { color: colors.background, fontWeight: '700' },
    item: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.btn,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    thumb: { width: 90, height: 54, borderRadius: 6, backgroundColor: colors.surface },
    itemText: { flex: 1 },
    itemTitle: { color: colors.textPrimary, fontWeight: '600' },
    muted: { color: colors.textSecondary },
    remove: { color: colors.error, fontSize: sizes.text.xs },
    error: { color: colors.error },
    chatLink: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.accent1,
      borderRadius: sizes.radius.input,
      padding: 14,
      alignItems: 'center',
    },
  })
