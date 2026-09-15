import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

const starterMessages = [
  'I am here with you.',
  'I am proud of us.',
  'I love the way we grow together.',
]

export default function ReassuranceCounter() {
  const [messages, setMessages] = useState<string[]>(starterMessages)
  const [draft, setDraft] = useState('')

  const count = useMemo(() => messages.length, [messages])

  const addMessage = () => {
    const value = draft.trim()
    if (!value) return
    setMessages((current) => [...current, value])
    setDraft('')
  }

  return (
    <WellnessBoardShell
      title="Reassurance Counter"
      subtitle="Gentle truths"
      badge={`${count} notes`}
    >
      <View style={styles.list}>
        {messages.map((message, index) => (
          <View key={`${message}-${index}`} style={styles.note}>
            <Text style={styles.noteText}>{message}</Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Write a reassuring line"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <Pressable onPress={addMessage} style={styles.button}>
          <Text style={styles.buttonText}>Add note</Text>
        </Pressable>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10, marginBottom: 12 },
  note: {
    backgroundColor: '#1a1d29',
    borderWidth: 1,
    borderColor: '#313146',
    borderRadius: 14,
    padding: 12,
  },
  noteText: { color: '#e7dbe7', fontSize: 13, lineHeight: 18 },
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
