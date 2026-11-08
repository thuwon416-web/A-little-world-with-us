import AsyncStorage from '@react-native-async-storage/async-storage'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { useEffect, useState } from 'react'
import { Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { sizes } from '@/design-tokens'

type ArchiveEntry = { id: number; title: string; date: string; rating: number; note: string }

const STORAGE_KEY = 'a-little-world-with-us-date-archive'

function validEntry(value: unknown): value is ArchiveEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<ArchiveEntry>
  return typeof entry.id === 'number' && typeof entry.title === 'string' && typeof entry.date === 'string'
    && typeof entry.rating === 'number' && typeof entry.note === 'string'
}

export default function DateArchiveSection() {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [rating, setRating] = useState(5)

  const save = async (next: ArchiveEntry[]) => {
    setEntries(next)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return
      try {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) setEntries(parsed.filter(validEntry))
      } catch {
        Alert.alert('Archive recovered', 'Saved date archive data could not be read. You can restore a JSON export if you have one.')
      }
    })
  }, [])

  const addEntry = async () => {
    if (!title.trim() || !note.trim()) {
      Alert.alert('Add a date name and memory note first.')
      return
    }
    await save([{ id: Date.now(), title: title.trim(), date, rating, note: note.trim() }, ...entries])
    setTitle('')
    setNote('')
    setRating(5)
  }

  const exportArchive = async () => {
    const content = JSON.stringify({ format: 'a-little-world-date-archive', version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)
    const uri = `${FileSystem.cacheDirectory}a-little-world-date-archive.json`
    await FileSystem.writeAsStringAsync(uri, content)
    await Share.share({ title: 'Date archive export', url: uri, message: content })
  }

  const restoreArchive = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true })
      if (picked.canceled || !picked.assets[0]) return
      const parsed: unknown = JSON.parse(await FileSystem.readAsStringAsync(picked.assets[0].uri))
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid archive')
      const archive = parsed as { format?: unknown; entries?: unknown }
      if (archive.format !== 'a-little-world-date-archive' || !Array.isArray(archive.entries)) throw new Error('Invalid archive')
      const restored = archive.entries.filter(validEntry)
      const merged = [...restored, ...entries.filter((entry) => !restored.some((item) => item.id === entry.id))]
      await save(merged)
      Alert.alert('Archive restored', `${restored.length} date ${restored.length === 1 ? 'entry was' : 'entries were'} restored.`)
    } catch {
      Alert.alert('Unable to restore', 'Choose a valid A Little World date archive JSON export.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Date archive</Text>
      <Text style={styles.muted}>Private local memories. Export or restore only when you choose.</Text>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Export date archive" onPress={() => void exportArchive()} style={styles.button}><Text style={styles.buttonText}>Export</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Restore date archive" onPress={() => void restoreArchive()} style={styles.button}><Text style={styles.buttonText}>Restore</Text></TouchableOpacity>
      </View>
      {entries.map((entry) => <View key={entry.id} style={styles.card}><Text style={styles.title}>{entry.title} {'★'.repeat(Math.max(1, Math.min(5, entry.rating)))}</Text><Text style={styles.muted}>{entry.date}</Text><Text style={styles.note}>{entry.note}</Text></View>)}
      <TextInput accessibilityLabel="Date name" value={title} onChangeText={setTitle} placeholder="Date name" placeholderTextColor={colors.textSecondary} style={styles.input} />
      <TextInput accessibilityLabel="Date in YYYY-MM-DD format" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} style={styles.input} />
      <TextInput accessibilityLabel="Memory note" value={note} onChangeText={setNote} placeholder="One-line memory" placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.noteInput]} />
      <View style={styles.actions}>{[1, 2, 3, 4, 5].map((value) => <TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={`${value} star rating`} accessibilityState={{ selected: rating === value }} onPress={() => setRating(value)} style={[styles.rating, rating === value && styles.ratingSelected]}><Text style={styles.buttonText}>{value}★</Text></TouchableOpacity>)}</View>
      <TouchableOpacity accessibilityRole="button" onPress={() => void addEntry()} style={[styles.button, styles.primary]}><Text style={styles.primaryText}>Add date</Text></TouchableOpacity>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { gap: 10, padding: 16 }, heading: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '700' }, title: { color: colors.textPrimary, fontWeight: '700' }, muted: { color: colors.textSecondary }, note: { color: colors.textPrimary, lineHeight: 20 }, card: { gap: 5, backgroundColor: colors.surface, borderColor: colors.cardBorder, borderRadius: sizes.radius.card, borderWidth: 1, padding: 12 }, actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, button: { alignItems: 'center', borderColor: colors.cardBorder, borderRadius: sizes.radius.input, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }, buttonText: { color: colors.textPrimary, fontWeight: '600' }, primary: { backgroundColor: colors.accent1, borderColor: colors.accent1 }, primaryText: { color: colors.background, fontWeight: '700' }, input: { borderColor: colors.cardBorder, borderRadius: sizes.radius.input, borderWidth: 1, color: colors.textPrimary, minHeight: 44, paddingHorizontal: 12 }, noteInput: { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' }, rating: { alignItems: 'center', borderColor: colors.cardBorder, borderRadius: sizes.radius.input, borderWidth: 1, minHeight: 40, justifyContent: 'center', minWidth: 48 }, ratingSelected: { borderColor: colors.accent1, backgroundColor: colors.surface },
})
