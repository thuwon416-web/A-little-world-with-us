import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

type NoteMood = 'sweet' | 'deep' | 'playful' | 'thankful'

type Note = {
  id: string
  title: string
  text: string
  mood: NoteMood
}

const starterNotes: Note[] = [
  { id: 'm1', title: 'For today', text: 'You make ordinary moments feel like magic.', mood: 'sweet' },
  { id: 'm2', title: 'Why I adore you', text: 'Your kindness softly changes the room for the better.', mood: 'deep' },
]

const moodStyles: Record<NoteMood, { backgroundColor: string; borderColor: string }> = {
  sweet: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' },
  deep: { backgroundColor: '#171d29', borderColor: '#b7c3f0' },
  playful: { backgroundColor: '#201d20', borderColor: '#f3c9a3' },
  thankful: { backgroundColor: '#2f2b1b', borderColor: '#f6dda7' },
}

export default function LoveNotesBoard() {
  const [notes, setNotes] = useState<Note[]>(starterNotes)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [mood, setMood] = useState<NoteMood>('sweet')

  const latest = useMemo(() => notes[notes.length - 1], [notes])

  const addNote = () => {
    const trimmedTitle = title.trim() || 'Untitled note'
    const trimmedText = text.trim()
    if (!trimmedText) {
      return
    }

    setNotes((current) => [
      ...current,
      {
        id: `note-${Date.now()}`,
        title: trimmedTitle,
        text: trimmedText,
        mood,
      },
    ])
    setTitle('')
    setText('')
    setMood('sweet')
  }

  return (
    <WellnessBoardShell title="Love Notes Board" subtitle="Tiny reminders" badge="love">
      <View style={styles.card}>
        <Text style={styles.label}>Latest note</Text>
        {latest ? (
          <View style={styles.latestBody}>
            <View style={styles.latestHeader}>
              <Text style={styles.latestTitle}>{latest.title}</Text>
              <View style={[styles.pill, moodStyles[latest.mood]]}>
                <Text style={styles.pillText}>{latest.mood}</Text>
              </View>
            </View>
            <Text style={styles.latestText}>{latest.text}</Text>
          </View>
        ) : (
          <Text style={styles.empty}>No notes yet.</Text>
        )}
      </View>

      <View style={styles.form}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#8f8393" style={styles.input} />
        <TextInput value={text} onChangeText={setText} placeholder="Write a note for your favorite person..." placeholderTextColor="#8f8393" multiline numberOfLines={3} style={[styles.input, styles.textArea]} />
        <View style={styles.row}>
          <View style={styles.selectWrap}>
            <Text style={styles.selectLabel}>{mood}</Text>
          </View>
          <Pressable onPress={addNote} style={styles.button}>
            <Text style={styles.buttonText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1b1c29',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2f3346',
  },
  label: {
    color: '#d1bfd2',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  latestBody: {
    backgroundColor: '#222535',
    borderRadius: 12,
    padding: 10,
  },
  latestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  latestTitle: {
    color: '#f3edf5',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    color: '#f4edf5',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  latestText: {
    color: '#e6d9eb',
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    color: '#cabed2',
    fontSize: 13,
  },
  form: {
    backgroundColor: '#1a1b26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2f3346',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    minHeight: 82,
    textAlignVertical: 'top',
  },
  selectWrap: {
    flex: 1,
    backgroundColor: '#121821',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31384c',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectLabel: {
    color: '#f5edf5',
    fontSize: 14,
    textTransform: 'capitalize',
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
})
