import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type Letter = {
  id: string
  title: string
  content: string
  unlocked: boolean
}

const starterLetters: Letter[] = [
  { id: 'l1', title: 'For the hard days', content: 'You are still my safe place.', unlocked: true },
  {
    id: 'l2',
    title: 'For the good days',
    content: 'I hope you feel how deeply I cherish you.',
    unlocked: false,
  },
]

export default function SecretLetterTray() {
  const [letters, setLetters] = useState<Letter[]>(starterLetters)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const toggleUnlock = (id: string) => {
    setLetters((current) =>
      current.map((letter) =>
        letter.id === id ? { ...letter, unlocked: !letter.unlocked } : letter
      )
    )
  }

  const addLetter = () => {
    const titleValue = title.trim()
    const contentValue = content.trim()
    if (!titleValue || !contentValue) {
      return
    }

    setLetters((current) => [
      ...current,
      { id: `letter-${Date.now()}`, title: titleValue, content: contentValue, unlocked: false },
    ])
    setTitle('')
    setContent('')
  }

  return (
    <WellnessBoardShell title="Secret Letter Tray" subtitle="Private notes" badge="locked">
      <View style={styles.list}>
        {letters.map((letter) => (
          <Pressable
            key={letter.id}
            onPress={() => toggleUnlock(letter.id)}
            style={[styles.note, letter.unlocked && styles.noteUnlocked]}
          >
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{letter.title}</Text>
              <Text style={styles.noteState}>{letter.unlocked ? 'open' : 'locked'}</Text>
            </View>
            <Text style={styles.noteText}>
              {letter.unlocked ? letter.content : 'This letter is waiting for the right moment.'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Letter title"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write a private note..."
          placeholderTextColor="#8f8393"
          multiline
          numberOfLines={3}
          style={[styles.input, styles.textArea]}
        />
        <Pressable onPress={addLetter} style={styles.button}>
          <Text style={styles.buttonText}>Add letter</Text>
        </Pressable>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    marginBottom: 14,
  },
  note: {
    backgroundColor: '#1c1d29',
    borderWidth: 1,
    borderColor: '#313146',
    borderRadius: 14,
    padding: 12,
  },
  noteUnlocked: {
    backgroundColor: '#232635',
    borderColor: '#d8b9c8',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  noteTitle: {
    flex: 1,
    color: '#f4edf5',
    fontSize: 14,
    fontWeight: '600',
  },
  noteState: {
    color: '#d4c0d7',
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  noteText: {
    marginTop: 8,
    color: '#e1d8e6',
    fontSize: 13,
    lineHeight: 18,
  },
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
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
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
})
