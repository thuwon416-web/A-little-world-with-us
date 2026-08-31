import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type JournalItem = {
  id: string
  title: string
  kind: 'grace' | 'wish' | 'restore' | 'notice'
  done: boolean
}

const starterItems: JournalItem[] = [
  { id: 'grace-1', title: 'The way kindness softened the room', kind: 'grace', done: true },
  { id: 'grace-2', title: 'A tiny wish to carry into tomorrow', kind: 'wish', done: false },
  {
    id: 'grace-3',
    title: 'A quiet moment that helped us feel restored',
    kind: 'restore',
    done: true,
  },
]

const kindMeta: Record<
  JournalItem['kind'],
  { label: string; backgroundColor: string; borderColor: string; color: string }
> = {
  grace: { label: 'grace', backgroundColor: '#2d2234', borderColor: '#d8b9c8', color: '#f4edf5' },
  wish: { label: 'wish', backgroundColor: '#201d29', borderColor: '#d8b9c8', color: '#f0c9d9' },
  restore: {
    label: 'restore',
    backgroundColor: '#201d29',
    borderColor: '#d8b9c8',
    color: '#f0c9d9',
  },
  notice: { label: 'notice', backgroundColor: '#1b2129', borderColor: '#b7d7c8', color: '#edf8f2' },
}

const prompts = [
  'What grace showed up in the way you met each other today?',
  'What small wish would make tomorrow feel a little kinder?',
  'What felt restorative enough to hold onto?',
  'What tiny detail deserves a second look and a little gratitude?',
]

export default function GraceJournalBoard() {
  const [items, setItems] = useState<JournalItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<JournalItem['kind']>('grace')
  const [promptIndex, setPromptIndex] = useState(0)

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const addItem = () => {
    const value = title.trim()
    if (!value) return
    setItems((current) => [
      ...current,
      { id: `grace-${Date.now()}`, title: value, kind, done: false },
    ])
    setTitle('')
  }

  const rotatePrompt = () => setPromptIndex((current) => (current + 1) % prompts.length)

  return (
    <WellnessBoardShell title="Grace Journal" subtitle="Grace meter" badge="journal">
      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Grace meter</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const meta = kindMeta[item.kind]
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              style={[styles.item, item.done && styles.itemDone]}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: meta.backgroundColor, borderColor: meta.borderColor },
                  ]}
                >
                  <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.itemState}>{item.done ? 'done' : 'later'}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.form}>
        <View style={styles.toneRow}>
          {(['grace', 'wish', 'restore', 'notice'] as JournalItem['kind'][]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setKind(option)}
              style={[styles.modeButton, kind === option && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, kind === option && styles.modeTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Write a small note of grace"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add note</Text>
        </Pressable>
      </View>

      <View style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptLabel}>Reflection prompt</Text>
          <Pressable onPress={rotatePrompt} style={styles.promptButton}>
            <Text style={styles.promptButtonText}>Next</Text>
          </Pressable>
        </View>
        <Text style={styles.promptText}>{prompts[promptIndex]}</Text>
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
    alignItems: 'flex-start',
    gap: 10,
  },
  itemDone: { backgroundColor: '#222536' },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pillText: { fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: '700' },
  itemText: { color: '#f4edf5', fontSize: 13, lineHeight: 18 },
  itemTextDone: { textDecorationLine: 'line-through', opacity: 0.7 },
  itemState: {
    color: '#c8b6cc',
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#1a1b26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2f3346',
    marginBottom: 12,
  },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  modeButton: {
    flexBasis: '22%',
    backgroundColor: '#121821',
    borderWidth: 1,
    borderColor: '#31384c',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeButtonActive: { borderColor: '#d8b9c8', backgroundColor: '#2a2131' },
  modeText: { color: '#f3edf4', fontSize: 10, letterSpacing: 1.0, textTransform: 'uppercase' },
  modeTextActive: { color: '#f8dfe8' },
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
  promptCard: { backgroundColor: '#2a2131', borderRadius: 14, padding: 12 },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptLabel: { color: '#f0c9d9', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  promptButton: {
    backgroundColor: '#d5b0c7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  promptButtonText: {
    color: '#181821',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  promptText: { color: '#f5edf4', fontSize: 13, lineHeight: 18 },
})
