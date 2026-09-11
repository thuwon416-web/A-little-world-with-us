import YouTube from 'react-native-youtube-iframe'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { addWatchHistory, addWatchlistItem, extractYouTubeId, getWatchContext, getWatchlist, removeWatchlistItem, sendWatchSync, subscribeToWatchSync, type WatchlistItem } from '@/services/watchTogether'

export default function WatchTogetherScreen() {
  const router = useRouter()
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [current, setCurrent] = useState<WatchlistItem | null>(null)
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let dispose: (() => void) | undefined
    void getWatchContext().then(async (context) => {
      setCoupleId(context.coupleId)
      setUserId(context.user.id)
      const loaded = await getWatchlist(context.coupleId as string)
      setItems(loaded); setCurrent(loaded[0] ?? null)
      dispose = subscribeToWatchSync(context.coupleId as string, (event, payload) => {
        if (event === 'video' && payload.youtubeId) setCurrent(loaded.find((item) => item.youtube_id === payload.youtubeId) ?? null)
        if (event === 'play') setPlaying(true)
        if (event === 'pause') setPlaying(false)
        if (event === 'seek' && payload.position !== undefined) setPosition(payload.position)
      })
    }).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load Watch Together.'))
    return () => dispose?.()
  }, [])

  const selectVideo = async (item: WatchlistItem) => {
    setCurrent(item); setPlaying(false)
    if (coupleId) await sendWatchSync(coupleId, 'video', { youtubeId: item.youtube_id })
    if (coupleId && userId) await addWatchHistory(coupleId, userId, item.youtube_id)
  }
  const add = async () => {
    const id = extractYouTubeId(input)
    if (!id || !coupleId || !userId) { setError('Enter a valid YouTube URL or 11-character video ID.'); return }
    try {
      const item = await addWatchlistItem(coupleId, userId, id, title)
      setItems((old) => [...old, item]); setCurrent((old) => old ?? item); setInput(''); setTitle(''); setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to add video.') }
  }
  const toggle = async () => {
    const next = !playing; setPlaying(next)
    if (coupleId) await sendWatchSync(coupleId, next ? 'play' : 'pause', { position })
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>Watch Together</Text><Text style={styles.title}>A shared screen for your next story</Text>
    {error && <Text style={styles.error}>{error}</Text>}
    {current ? <View style={styles.player}><YouTube height={220} videoId={current.youtube_id} play={playing} onChangeState={(state) => { if (state === 'playing') setPlaying(true); if (state === 'paused') setPlaying(false) }} /><Text style={styles.now}>{current.title}</Text><TouchableOpacity style={styles.button} onPress={() => void toggle()}><Text style={styles.buttonText}>{playing ? 'Pause' : 'Play'}</Text></TouchableOpacity></View> : <Text style={styles.muted}>Add a video to start your watch party.</Text>}
    <View style={styles.card}><Text style={styles.section}>Add to watchlist</Text><TextInput value={input} onChangeText={setInput} placeholder="YouTube URL or video ID" placeholderTextColor="#8d8d99" style={styles.input} autoCapitalize="none" /><TextInput value={title} onChangeText={setTitle} placeholder="Title (optional)" placeholderTextColor="#8d8d99" style={styles.input} /><TouchableOpacity style={styles.button} onPress={() => void add()}><Text style={styles.buttonText}>Add video</Text></TouchableOpacity></View>
    <Text style={styles.section}>Watchlist</Text>{items.map((item) => <View key={item.id} style={styles.item}><Image source={{ uri: item.thumbnail_url ?? undefined }} style={styles.thumb} /><TouchableOpacity style={styles.itemText} onPress={() => void selectVideo(item)}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.muted}>Play together</Text></TouchableOpacity><TouchableOpacity onPress={() => Alert.alert('Remove video?', item.title, [{ text: 'Cancel' }, { text: 'Remove', style: 'destructive', onPress: () => void removeWatchlistItem(item.id).then(() => setItems((old) => old.filter((row) => row.id !== item.id))) }])}><Text style={styles.remove}>Remove</Text></TouchableOpacity></View>)}
    <TouchableOpacity style={styles.chatLink} onPress={() => router.push('/chat')}><Text style={styles.buttonText}>Open party chat</Text></TouchableOpacity>
    <TouchableOpacity onPress={() => void Linking.openURL('https://support.google.com/youtube/answer/171780')}><Text style={styles.muted}>YouTube playback help</Text></TouchableOpacity>
  </ScrollView>
}

const styles = StyleSheet.create({ container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 }, eyebrow: { color: '#d9bfd7', letterSpacing: 2, textTransform: 'uppercase', fontSize: 12 }, title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' }, player: { backgroundColor: '#171b22', borderRadius: 18, overflow: 'hidden', paddingBottom: 14 }, now: { color: '#fff', fontWeight: '700', padding: 14 }, card: { backgroundColor: '#171b22', borderRadius: 18, padding: 16, gap: 10 }, section: { color: '#fff', fontSize: 20, fontWeight: '700' }, input: { backgroundColor: '#242832', color: '#fff', borderRadius: 10, padding: 12 }, button: { backgroundColor: '#ff6b81', borderRadius: 10, padding: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '700' }, item: { backgroundColor: '#171b22', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, thumb: { width: 90, height: 54, borderRadius: 6, backgroundColor: '#242832' }, itemText: { flex: 1 }, itemTitle: { color: '#fff', fontWeight: '600' }, muted: { color: '#a8a4ad' }, remove: { color: '#ff9b9b', fontSize: 12 }, error: { color: '#ff9b9b' }, chatLink: { backgroundColor: '#343044', borderRadius: 10, padding: 14, alignItems: 'center' } })
