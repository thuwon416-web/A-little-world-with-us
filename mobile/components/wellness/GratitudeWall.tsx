import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

const starterEntries = [
  'I am grateful for the way you make even ordinary mornings feel warm.',
  'I love how safe and seen I feel when I am with you.',
  'Thank you for being gentle with my heart and patient with my growth.',
]

export default function GratitudeWall() {
  const [entries, setEntries] = useState(starterEntries)
  const [draft, setDraft] = useState('')

  const addEntry = () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    setEntries((current) => [trimmed, ...current])
    setDraft('')
  }

  return (
    <WellnessBoardShell title="Gratitude Wall" subtitle="Thankful notes" badge="wall">
      <View style={styles.list}>
        {entries.map((entry, index) => (
          <View key={`${entry}-${index}`} style={styles.entry}>
            <Text style={styles.entryText}>{entry}</Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="What do you want to thank them for today?"
          placeholderTextColor="#8f8393"
          multiline
          numberOfLines={3}
          style={[styles.input, styles.textArea]}
        />
        <Pressable onPress={addEntry} style={styles.button}>
          <Text style={styles.buttonText}>Add to wall</Text>
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
  entry: {
    backgroundColor: '#1d1d2a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2f3346',
    padding: 12,
  },
  entryText: {
    color: '#e7dbe7',
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
    minHeight: 80,
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
