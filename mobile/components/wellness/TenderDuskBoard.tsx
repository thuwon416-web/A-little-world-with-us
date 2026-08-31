import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type DuskItem = {
  id: string
  feeling: string
  mood: 'glow' | 'calm' | 'soft' | 'ease'
  done: boolean
}

const starterItems: DuskItem[] = [
  { id: 'dusk-1', feeling: 'Let the day settle into gentle rest', mood: 'glow', done: true },
  {
    id: 'dusk-2',
    feeling: 'Trade the busy energy for something more tender',
    mood: 'calm',
    done: false,
  },
  {
    id: 'dusk-3',
    feeling: 'Make room for the quiet that wants to arrive',
    mood: 'soft',
    done: true,
  },
]

const moodMeta: Record<
  DuskItem['mood'],
  { label: string; style: { backgroundColor: string; borderColor: string } }
> = {
  glow: { label: 'glow', style: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' } },
  calm: { label: 'calm', style: { backgroundColor: '#1a1d24', borderColor: '#d9e2ff' } },
  soft: { label: 'soft', style: { backgroundColor: '#1c2129', borderColor: '#b0d8c5' } },
  ease: { label: 'ease', style: { backgroundColor: '#2a2131', borderColor: '#d8b9c8' } },
}

const prompts = [
  'What would make this evening feel less rushed and more tender?',
  'How can we let the day settle more gently?',
  'What small comfort would help the transition feel more graceful?',
  'Where can we pause and let the day softly rest?',
]

export default function TenderDuskBoard() {
  const [items, setItems] = useState<DuskItem[]>(starterItems)
  const [feeling, setFeeling] = useState('')
  const [mood, setMood] = useState<DuskItem['mood']>('glow')
  const [promptIndex, setPromptIndex] = useState(0)

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const addItem = () => {
    const value = feeling.trim()
    if (!value) return

    setItems((current) => [
      ...current,
      { id: `dusk-${Date.now()}`, feeling: value, mood, done: false },
    ])
    setFeeling('')
  }

  const rotatePrompt = () => {
    setPromptIndex((current) => (current + 1) % prompts.length)
  }

  return (
    <WellnessBoardShell title="Tender Dusk" subtitle="Evening transition" badge="dusk">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Evening transition</Text>
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
              <View style={[styles.pill, moodMeta[item.mood].style]}>
                <Text style={styles.pillText}>{moodMeta[item.mood].label}</Text>
              </View>
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
                {item.feeling}
              </Text>
            </View>
            <Text style={styles.itemState}>{item.done ? 'done' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <View style={styles.optionRow}>
          {(['glow', 'calm', 'soft', 'ease'] as DuskItem['mood'][]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setMood(option)}
              style={[styles.option, option === mood && styles.optionSelected]}
            >
              <Text style={[styles.optionText, option === mood && styles.optionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={feeling}
          onChangeText={setFeeling}
          placeholder="Add an evening transition"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptLabel}>Prompt</Text>
          <Pressable onPress={rotatePrompt} style={styles.shuffleButton}>
            <Text style={styles.shuffleText}>Next</Text>
          </Pressable>
        </View>
        <Text style={styles.promptText}>{prompts[promptIndex]}</Text>
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
  promptCard: {
    backgroundColor: '#2a2131',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d8b9c8',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptLabel: { color: '#f0c9d9', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  shuffleButton: {
    backgroundColor: '#1d1d2a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#4e4659',
  },
  shuffleText: { color: '#f4edf5', fontSize: 9, letterSpacing: 1.1, textTransform: 'uppercase' },
  promptText: { color: '#f5edf4', fontSize: 13, lineHeight: 18 },
})
