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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { useAuth } from '@/lib/auth'
import {
  getCalendarData,
  saveListItem,
  toggleListItem,
  deleteListItem,
  type ListItem,
} from '@/services/calendar'

export default function ListsScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = createStyles(colors, sizes)
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
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
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
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TouchableOpacity style={styles.add} onPress={() => void add()}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.check}
            onPress={() => void toggleListItem(tab, item.id, !item.completed).then(load)}
          >
            <Check color={item.completed ? colors.background : colors.textSecondary} size={18} />
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
            <Trash2 color={colors.error} size={17} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  )
}
const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.background, padding: 20, gap: 14 },
    eyebrow: { color: colors.accent2, letterSpacing: 2, fontSize: sizes.text.xs },
    title: { color: colors.textPrimary, fontSize: sizes.text.hLg, fontWeight: '700' },
    tabs: { flexDirection: 'row', gap: 8 },
    tab: {
      flex: 1,
      padding: 12,
      borderRadius: sizes.radius.input,
      backgroundColor: colors.cardBorder,
      alignItems: 'center',
    },
    active: { backgroundColor: colors.accent1 },
    tabText: { color: colors.background, fontWeight: '700' },
    error: { color: colors.error },
    form: { flexDirection: 'row', gap: 8 },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      borderRadius: sizes.radius.input,
      padding: 12,
    },
    add: {
      backgroundColor: colors.accent1,
      borderRadius: sizes.radius.input,
      paddingHorizontal: 18,
      justifyContent: 'center',
    },
    addText: { color: colors.background, fontWeight: '800' },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 14,
    },
    check: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemText: { flex: 1, color: colors.textPrimary, fontSize: sizes.text.body },
    done: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  })
