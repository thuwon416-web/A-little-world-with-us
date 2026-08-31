import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type PromiseItem = {
  id: string
  label: string
  done: boolean
}

type DreamDateIdea = {
  title: string
  detail: string
  mood: string[]
}

const starterPromises: PromiseItem[] = [
  { id: 'promise-1', label: 'No phones at dinner tonight', done: true },
  { id: 'promise-2', label: 'Tell each other one genuine appreciation', done: false },
  { id: 'promise-3', label: 'Keep the evening slow and easy', done: true },
]

const dreamDates: DreamDateIdea[] = [
  {
    title: 'Moonlit Picnic',
    detail:
      'Pack a blanket, warm drinks, and let the evening become a little slower and softer than usual.',
    mood: ['cozy', 'soft', 'romantic'],
  },
  {
    title: 'Hidden Cafe Date',
    detail:
      'Find a tiny neighborhood place with good music and stay way longer than the plan allows.',
    mood: ['playful', 'easy', 'quiet'],
  },
  {
    title: 'Sunset Photo Walk',
    detail:
      'Take a few minutes to wander, laugh, and notice all the tiny details in the world around you.',
    mood: ['adventurous', 'sweet', 'present'],
  },
  {
    title: 'At-Home Cinema Night',
    detail:
      'Make the blanket nest, choose a comfort movie, and make the room feel like a tiny planet of love.',
    mood: ['cozy', 'gentle', 'unhurried'],
  },
]

export default function CouplePromiseBoard() {
  const [promises, setPromises] = useState<PromiseItem[]>(starterPromises)
  const [draft, setDraft] = useState('')
  const [dateIndex, setDateIndex] = useState(0)

  const doneCount = useMemo(() => promises.filter((item) => item.done).length, [promises])
  const progress = promises.length ? Math.round((doneCount / promises.length) * 100) : 0
  const currentDate = dreamDates[dateIndex] ?? dreamDates[0]

  const togglePromise = (id: string) => {
    setPromises((current) =>
      current.map((promise) => (promise.id === id ? { ...promise, done: !promise.done } : promise))
    )
  }

  const addPromise = () => {
    const value = draft.trim()
    if (!value) return

    setPromises((current) => [
      ...current,
      { id: `promise-${Date.now()}`, label: value, done: false },
    ])
    setDraft('')
  }

  const shuffleIdea = () => {
    setDateIndex((current) => (current + 1) % dreamDates.length)
  }

  return (
    <WellnessBoardShell title="Couple Promise Board" subtitle="Shared promises" badge="promise">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Shared promises</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.count}>
          {doneCount}/{promises.length} kept
        </Text>
      </View>

      <View style={styles.list}>
        {promises.map((promise) => (
          <Pressable
            key={promise.id}
            onPress={() => togglePromise(promise.id)}
            style={[styles.promiseItem, promise.done && styles.promiseDone]}
          >
            <Text style={[styles.promiseText, promise.done && styles.promiseTextDone]}>
              {promise.label}
            </Text>
            <Text style={styles.promiseState}>{promise.done ? 'done' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.formRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a promise to keep"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addPromise} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.dreamCard}>
        <View style={styles.dreamHeader}>
          <Text style={styles.dreamLabel}>Dream date idea</Text>
          <Pressable onPress={shuffleIdea} style={styles.shuffleButton}>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </Pressable>
        </View>
        <Text style={styles.dreamTitle}>{currentDate.title}</Text>
        <Text style={styles.dreamDetail}>{currentDate.detail}</Text>
        <View style={styles.tagsRow}>
          {currentDate.mood.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: '#1b1a29',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2f3346',
    padding: 12,
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
  promiseItem: {
    backgroundColor: '#1d1d2a',
    borderWidth: 1,
    borderColor: '#2f3346',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  promiseDone: {
    backgroundColor: '#2b2134',
    borderColor: '#d8b9c8',
  },
  promiseText: {
    color: '#f3edf5',
    fontSize: 13,
    flex: 1,
  },
  promiseTextDone: {
    opacity: 0.7,
    textDecorationLine: 'line-through',
  },
  promiseState: {
    color: '#d1bfd2',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    backgroundColor: '#121821',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31384c',
    color: '#f5edf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#d5b0c7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#181821',
    fontWeight: '700',
    fontSize: 14,
  },
  dreamCard: {
    backgroundColor: '#2b213b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d8b9c8',
  },
  dreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  dreamLabel: {
    color: '#f0c9d9',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shuffleButton: {
    backgroundColor: '#1e1a2b',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#534a60',
  },
  shuffleText: {
    color: '#f4edf5',
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  dreamTitle: {
    color: '#f4edf5',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  dreamDetail: {
    color: '#e7dbe7',
    fontSize: 13,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#1a1d2a',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#423d60',
  },
  tagText: {
    color: '#f0c9d9',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
})
