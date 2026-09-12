import { Check, Trash2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuth } from '@/lib/auth'
import {
  getCalendarData,
  saveListItem,
  toggleListItem,
  deleteListItem,
  type ListItem,
} from '@/services/calendar'

export default function ListsScreen() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'bucket' | 'wishlist'>('bucket')
  const [items, setItems] = useState<ListItem[]>([])
  const [coupleId, setCoupleId] = useState('')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const load = async () => {
    try {
      const data = await getCalendarData()
      setCoupleId(data.coupleId)
      setItems(tab === 'bucket' ? data.bucket : data.wishlist)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load lists.')
    }
  }
  useEffect(() => {
    void load()
  }, [tab, user?.id])
  const add = async () => {
    if (!draft.trim() || draft.trim().length > 100 || !user)
      return Alert.alert('Invalid item', 'Enter an item up to 100 characters.')
    try {
      await saveListItem(coupleId, user.id, tab, draft.trim())
      setDraft('')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add item.')
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>SHARED LISTS</Text>
      <Text style={styles.title}>Bucket list & Wishlist</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'bucket' && styles.active]}
          onPress={() => setTab('bucket')}
        >
          <Text style={styles.tabText}>Bucket list</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'wishlist' && styles.active]}
          onPress={() => setTab('wishlist')}
        >
          <Text style={styles.tabText}>Wishlist</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={tab === 'bucket' ? 'A dream to share' : 'A gift idea'}
          placeholderTextColor="#8d8d99"
          style={styles.input}
        />
        <TouchableOpacity style={styles.add} onPress={() => void add()}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <TouchableOpacity
            style={styles.check}
            onPress={() => void toggleListItem(tab, item.id, !item.completed).then(load)}
          >
            <Check color={item.completed ? '#fff' : '#8d8d99'} size={18} />
          </TouchableOpacity>
          <Text style={[styles.itemText, item.completed && styles.done]}>
            {item.item || item.title}
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Delete item?', '', [
                { text: 'Cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => void deleteListItem(tab, item.id).then(load),
                },
              ])
            }
          >
            <Trash2 color="#ff9b9b" size={17} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 },
  eyebrow: { color: '#d9bfd7', letterSpacing: 2, fontSize: 12 },
  title: { color: '#fff', fontSize: 29, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#2a2d36', alignItems: 'center' },
  active: { backgroundColor: '#ff6b81' },
  tabText: { color: '#fff', fontWeight: '700' },
  error: { color: '#ff9b9b' },
  form: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#171b22', color: '#fff', borderRadius: 12, padding: 12 },
  add: {
    backgroundColor: '#ff6b81',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontWeight: '800' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#171b22',
    borderRadius: 14,
    padding: 14,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2d36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { flex: 1, color: '#fff', fontSize: 15 },
  done: { color: '#8d8d99', textDecorationLine: 'line-through' },
})
