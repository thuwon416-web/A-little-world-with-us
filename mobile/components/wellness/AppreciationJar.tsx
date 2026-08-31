import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

type Appreciation = {
  id: string
  text: string
}

const starterAppreciations: Appreciation[] = [
  { id: 'a1', text: 'You make everything feel safer and softer.' },
  { id: 'a2', text: 'Your laughter is one of my favorite sounds.' },
]

export default function AppreciationJar() {
  const [items, setItems] = useState<Appreciation[]>(starterAppreciations)
  const [draft, setDraft] = useState('')

  const addItem = () => {
    const value = draft.trim()
    if (!value) return

    setItems((current) => [...current, { id: `app-${Date.now()}`, text: value }])
    setDraft('')
  }

  return (
    <WellnessBoardShell title="Appreciation Jar" subtitle="Gratitude for the little things" badge="jar">
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.entry}>
            <Text style={styles.entryText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write something you appreciate"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteLabel}>Reminder</Text>
        <Text style={styles.noteText}>A gratitude note can turn a good day into a beautiful one.</Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    marginBottom: 14,
  },
  entry: {
    backgroundColor: '#1d1d2a',
    borderWidth: 1,
    borderColor: '#2f3346',
    borderRadius: 14,
    padding: 12,
  },
  entryText: {
    color: '#e6dbe7',
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
    marginTop: 14,
    backgroundColor: '#2a2131',
    borderRadius: 14,
    padding: 12,
  },
  noteLabel: {
    color: '#f0c9d9',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  noteText: {
    color: '#f5edf4',
    fontSize: 13,
    lineHeight: 18,
  },
})
