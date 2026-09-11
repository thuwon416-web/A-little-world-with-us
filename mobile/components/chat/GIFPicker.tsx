import { Search, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

type Props = { visible: boolean; onClose: () => void; onSelect: (url: string) => Promise<void> }
const fallbackGifs = ['https://media.giphy.com/media/3o7TKoWXm3okO1kgHC/giphy.gif', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif']

export function GIFPicker({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState(fallbackGifs)
  const [sending, setSending] = useState(false)
  const search = async () => {
    const key = process.env.EXPO_PUBLIC_GIPHY_API_KEY
    if (!key || !query.trim()) { setGifs(fallbackGifs); return }
    const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(query)}&limit=12`)
    if (!response.ok) throw new Error('GIF search is unavailable.')
    const payload = await response.json() as { data?: Array<{ images?: { downsized_medium?: { url?: string } } }> }
    setGifs((payload.data || []).map((item) => item.images?.downsized_medium?.url).filter((url): url is string => Boolean(url)))
  }
  const select = async (url: string) => { setSending(true); try { await onSelect(url); onClose() } catch (error) { Alert.alert('GIF failed', error instanceof Error ? error.message : 'Unable to send GIF.') } finally { setSending(false) } }
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.card}>
    <View style={styles.header}><Text style={styles.title}>Choose a GIF</Text><TouchableOpacity onPress={onClose}><X color="#f3f0f5" size={22} /></TouchableOpacity></View>
    <View style={styles.search}><Search color="#aaa7b2" size={18} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => void search()} placeholder="Search GIFs" placeholderTextColor="#8d8d99" style={styles.input} /></View>
    <ScrollView contentContainerStyle={styles.grid}>{gifs.map((url) => <TouchableOpacity key={url} style={styles.gif} onPress={() => void select(url)} disabled={sending}>{process.env.EXPO_PUBLIC_GIPHY_API_KEY ? <Image source={{ uri: url }} style={styles.gifThumbnail} /> : <View style={styles.placeholder}><Text style={styles.gifText}>GIF</Text><Text style={styles.placeholderText}>Add a GIPHY API key for previews</Text></View>}</TouchableOpacity>)}</ScrollView>
  </View></View></Modal>
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  card: { maxHeight: '75%', backgroundColor: '#171b22', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#f3f0f5', fontSize: 20, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#252a34', borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, color: '#fff', paddingVertical: 11 },
  grid: { gap: 10, paddingVertical: 14 },
  gif: { backgroundColor: '#252a34', borderRadius: 12, overflow: 'hidden' },
  gifThumbnail: { width: '100%', height: 150, backgroundColor: '#252a34' },
  placeholder: { height: 100, alignItems: 'center', justifyContent: 'center', padding: 14 },
  gifText: { color: '#b88ae5', fontWeight: '800', fontSize: 18 },
  placeholderText: { color: '#aaa7b2', fontSize: 11, marginTop: 6, textAlign: 'center' },
})
