import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type ComfortItem = {
  id: string
  label: string
  done: boolean
}

const starterItems: ComfortItem[] = [
  { id: 'c1', label: 'Keep a slow pace today', done: true },
  { id: 'c2', label: 'Share a cozy moment', done: false },
  { id: 'c3', label: 'Hold the conversation gently', done: true },
]

export default function SoftComfortBoard() {
  const [items, setItems] = useState<ComfortItem[]>(starterItems)
  const [draft, setDraft] = useState('')

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    setItems((current) => [...current, { id: `comfort-${Date.now()}`, label: value, done: false }])
    setDraft('')
  }

  return (
    <WellnessBoardShell
      title="Soft Comfort Board"
      subtitle="Comfort rhythm"
      badge={`${doneCount}/${items.length}`}
    >
      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Comfort rhythm</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => toggleItem(item.id)}
            style={[styles.item, item.done && styles.itemDone]}
          >
            <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.label}</Text>
            <Text style={styles.itemState}>{item.done ? 'done' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comforting ritual"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add ritual</Text>
        </Pressable>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  progressBox: { backgroundColor: '#1b1c29', borderRadius: 14, padding: 12, marginBottom: 12 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { color: '#d0c3d2', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  progressValue: { color: '#f4edf5', fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 10, backgroundColor: '#121821', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#d5b0c7', borderRadius: 999 },
  list: { gap: 10, marginBottom: 12 },
  item: {
    backgroundColor: '#1a1d29',
    borderWidth: 1,
    borderColor: '#313146',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemDone: { backgroundColor: '#222536' },
  itemText: { color: '#f4edf5', fontSize: 13, flex: 1, lineHeight: 18 },
  itemTextDone: { textDecorationLine: 'line-through', opacity: 0.7 },
  itemState: { color: '#c8b6cc', fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase' },
  form: {
    backgroundColor: '#1a1b26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2f3346',
  },
  input: {
    backgroundColor: '#121821',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31384c',
    color: '#f5edf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#d5b0c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#181821', fontWeight: '700', fontSize: 14 },
})
