import { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { deleteMemory, getMemories, MemoryRecord } from '@/services/memories'
import { useRouter } from 'expo-router'

const categories = ['all', 'favorite', 'travel', 'ritual', 'journal'] as const

export default function MemoriesScreen() {
  const router = useRouter()
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [filter, setFilter] = useState<(typeof categories)[number]>('all')
  const [error, setError] = useState('')
  useEffect(() => { void getMemories().then(setMemories).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load memories.')) }, [])
  const visible = useMemo(() => filter === 'all' ? memories : memories.filter((memory) => memory.category === filter), [filter, memories])
  const remove = (memory: MemoryRecord) => Alert.alert('Delete memory?', 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => void deleteMemory(memory.id).then(() => setMemories((current) => current.filter((item) => item.id !== memory.id))).catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to delete memory.')) },
  ])
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>Memories</Text><Text style={styles.title}>Our story</Text>
    <TouchableOpacity style={styles.secondary} onPress={() => router.push('/(tabs)/gallery')}><Text style={styles.secondaryText}>Open photo gallery</Text></TouchableOpacity>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{categories.map((category) => <TouchableOpacity key={category} onPress={() => setFilter(category)} style={[styles.filter, filter === category && styles.filterActive]}><Text style={styles.filterText}>{category}</Text></TouchableOpacity>)}</ScrollView>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {visible.length === 0 ? <Text style={styles.muted}>No structured memories in this category yet.</Text> : visible.map((memory) => <View key={memory.id} style={styles.card}><View style={styles.row}><Text style={styles.memoryTitle}>{memory.title}</Text><TouchableOpacity onPress={() => remove(memory)}><Text style={styles.delete}>Delete</Text></TouchableOpacity></View><Text style={styles.meta}>{memory.category} {memory.date ? `• ${memory.date}` : ''}</Text>{memory.caption ? <Text style={styles.caption}>{memory.caption}</Text> : null}</View>)}
  </ScrollView>
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 }, eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }, title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' }, secondary: { borderRadius: 12, padding: 12, backgroundColor: '#1f3b2f', alignItems: 'center' }, secondaryText: { color: '#f3f0f5', fontWeight: '700' }, filters: { gap: 8 }, filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#171b22' }, filterActive: { backgroundColor: '#d8b9c8' }, filterText: { color: '#f3f0f5', textTransform: 'capitalize' }, card: { backgroundColor: '#171b22', borderRadius: 18, borderWidth: 1, borderColor: '#2a2d35', padding: 16, gap: 7 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, memoryTitle: { color: '#f3f0f5', fontSize: 18, fontWeight: '700', flex: 1 }, meta: { color: '#d9bfd7', textTransform: 'capitalize', fontSize: 12 }, caption: { color: '#c4c4ce', lineHeight: 21 }, muted: { color: '#c4c4ce' }, error: { color: '#ff9b9b' }, delete: { color: '#ff9b9b', fontWeight: '700' },
})
