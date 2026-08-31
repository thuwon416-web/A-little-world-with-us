import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type CheckInItem = { id: string; text: string; kind: 'need' | 'offer' | 'ritual'; done: boolean }

const starterItems: CheckInItem[] = [
  { id: 'need-1', text: 'I need a softer evening today', kind: 'need', done: true },
  { id: 'offer-1', text: 'I can bring tea and a slow conversation', kind: 'offer', done: false },
  { id: 'ritual-1', text: 'A 10-minute cuddle and no phone check-in', kind: 'ritual', done: true },
]

const kindMeta: Record<
  CheckInItem['kind'],
  { label: string; style: { backgroundColor: string; borderColor: string } }
> = {
  need: { label: 'need', style: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' } },
  offer: { label: 'offer', style: { backgroundColor: '#171d29', borderColor: '#b7c3f0' } },
  ritual: { label: 'ritual', style: { backgroundColor: '#2a2131', borderColor: '#d8b9c8' } },
}

export default function LoveCheckInBoard() {
  const [items, setItems] = useState<CheckInItem[]>(starterItems)
  const [draft, setDraft] = useState('')
  const [kind, setKind] = useState<CheckInItem['kind']>('need')

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const addItem = () => {
    const value = draft.trim()
    if (!value) return

    setItems((current) => [
      ...current,
      { id: `checkin-${Date.now()}`, text: value, kind, done: false },
    ])
    setDraft('')
  }

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  return (
    <WellnessBoardShell title="Love Check-In" subtitle="Check-in rhythm" badge="checkin">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Check-in rhythm</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.count}>
          {doneCount}/{items.length}
        </Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => toggleItem(item.id)}
            style={[styles.item, item.done && styles.itemDone]}
          >
            <View style={styles.itemInner}>
              <View style={[styles.pill, kindMeta[item.kind].style]}>
                <Text style={styles.pillText}>{kindMeta[item.kind].label}</Text>
              </View>
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
            </View>
            <Text style={styles.itemState}>{item.done ? 'done' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <View style={styles.optionRow}>
          {(['need', 'offer', 'ritual'] as CheckInItem['kind'][]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setKind(option)}
              style={[styles.option, option === kind && styles.optionSelected]}
            >
              <Text style={[styles.optionText, option === kind && styles.optionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Share a need, offer, or ritual"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.featureLabel}>Gentle reminder</Text>
        <Text style={styles.featureText}>
          Check-ins work best when they are soft, honest, and kind. A small need is still a real
          one.
        </Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: '#1a1b26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2f3346',
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { color: '#d5c6d5', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  progressValue: { color: '#f4cbd8', fontSize: 11, fontWeight: '700' },
  barTrack: {
    height: 8,
    backgroundColor: '#101721',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#d5b0c7' },
  count: { color: '#c9bdcf', fontSize: 11 },
  list: { gap: 10, marginBottom: 14 },
  item: {
    backgroundColor: '#1d1d2a',
    borderWidth: 1,
    borderColor: '#2f3346',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  itemDone: { backgroundColor: '#241d2a', borderColor: '#d8b9c8' },
  itemInner: { flex: 1, gap: 8 },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillText: { color: '#f4edf5', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  itemText: { color: '#e7dbe7', fontSize: 13, lineHeight: 18 },
  itemTextDone: { opacity: 0.7, textDecorationLine: 'line-through' },
  itemState: {
    color: '#d1bfd2',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  form: {
    backgroundColor: '#1a1b26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2f3346',
    marginBottom: 14,
  },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  option: {
    flex: 1,
    backgroundColor: '#101821',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#31384c',
    paddingVertical: 8,
    alignItems: 'center',
  },
  optionSelected: { backgroundColor: '#2a2131', borderColor: '#d8b9c8' },
  optionText: { color: '#d7c5d7', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  optionTextSelected: { color: '#f5d5e5' },
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
  featureCard: {
    backgroundColor: '#2a2131',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d8b9c8',
  },
  featureLabel: {
    color: '#f0c9d9',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featureText: { color: '#f5edf4', fontSize: 13, lineHeight: 18 },
})
