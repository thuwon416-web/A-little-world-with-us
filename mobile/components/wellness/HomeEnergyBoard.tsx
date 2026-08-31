import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type EnergyItem = {
  id: string
  title: string
  mood: 'bright' | 'calm' | 'cozy' | 'reset'
  done: boolean
}

const starterItems: EnergyItem[] = [
  {
    id: 'energy-1',
    title: 'Open the curtains and let the room wake up',
    mood: 'bright',
    done: true,
  },
  { id: 'energy-2', title: 'Dim the lights and choose a slower pace', mood: 'calm', done: false },
  {
    id: 'energy-3',
    title: 'Make the space feel like a soft landing place',
    mood: 'cozy',
    done: true,
  },
]

const moodMeta: Record<
  EnergyItem['mood'],
  { label: string; style: { backgroundColor: string; borderColor: string } }
> = {
  bright: { label: 'bright', style: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' } },
  calm: { label: 'calm', style: { backgroundColor: '#171d29', borderColor: '#b7c3f0' } },
  cozy: { label: 'cozy', style: { backgroundColor: '#271d22', borderColor: '#f4c7a5' } },
  reset: { label: 'reset', style: { backgroundColor: '#1c2129', borderColor: '#b0d8c5' } },
}

const feelNotes = [
  'Turn the room into a place that helps your hearts settle.',
  'A small change in the space can change the feeling of the whole day.',
  'Choose what makes the home feel softer, brighter, and easier.',
]

export default function HomeEnergyBoard() {
  const [items, setItems] = useState<EnergyItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [mood, setMood] = useState<EnergyItem['mood']>('cozy')
  const [noteIndex, setNoteIndex] = useState(0)

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
      { id: `home-${Date.now()}`, title: value, mood, done: false },
    ])
    setTitle('')
  }

  const rotateNote = () => {
    setNoteIndex((current) => (current + 1) % feelNotes.length)
  }

  return (
    <WellnessBoardShell title="Home Energy" subtitle="Room rhythm" badge="home">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Room rhythm</Text>
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
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.title}</Text>
            </View>
            <Text style={styles.itemState}>{item.done ? 'done' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <View style={styles.optionRow}>
          {(['bright', 'calm', 'cozy', 'reset'] as EnergyItem['mood'][]).map((option) => (
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
          value={title}
          onChangeText={setTitle}
          placeholder="Add a small home comfort cue"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.noteCard}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteLabel}>Energy note</Text>
          <Pressable onPress={rotateNote} style={styles.shuffleButton}>
            <Text style={styles.shuffleText}>Next</Text>
          </Pressable>
        </View>
        <Text style={styles.noteText}>{feelNotes[noteIndex]}</Text>
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
  progressLabel: {
    color: '#d5c6d5',
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  progressValue: {
    color: '#f4cbd8',
    fontSize: 11,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#101721',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#d5b0c7',
  },
  count: {
    color: '#c9bdcf',
    fontSize: 11,
  },
  list: {
    gap: 10,
    marginBottom: 14,
  },
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
  itemDone: {
    backgroundColor: '#241d2a',
    borderColor: '#d8b9c8',
  },
  itemInner: {
    flex: 1,
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pillText: {
    color: '#f4edf5',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  itemText: {
    color: '#e7dbe7',
    fontSize: 13,
    lineHeight: 18,
  },
  itemTextDone: {
    opacity: 0.7,
    textDecorationLine: 'line-through',
  },
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
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  option: {
    flex: 1,
    backgroundColor: '#101821',
    borderWidth: 1,
    borderColor: '#31384c',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#2a2131',
    borderColor: '#d8b9c8',
  },
  optionText: {
    color: '#d7c5d7',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  optionTextSelected: {
    color: '#f5d5e5',
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
  buttonText: {
    color: '#181821',
    fontWeight: '700',
    fontSize: 14,
  },
  noteCard: {
    backgroundColor: '#2a2131',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d8b9c8',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteLabel: {
    color: '#f0c9d9',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shuffleButton: {
    backgroundColor: '#1d1d2a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#4e4659',
  },
  shuffleText: {
    color: '#f4edf5',
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  noteText: {
    color: '#f5edf4',
    fontSize: 13,
    lineHeight: 18,
  },
})
