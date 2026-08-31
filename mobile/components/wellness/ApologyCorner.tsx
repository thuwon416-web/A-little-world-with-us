import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

const templates = [
  'I am sorry for the way I hurt you and for not being gentler with your feelings.',
  'I am sorry for the silence that made you feel alone. I want to do better with my words and my attention.',
  'I am sorry for making you feel unseen. I love you, and I want to repair this with patience and care.',
]

export default function ApologyCorner() {
  const [draft, setDraft] = useState(templates[0])
  const [submitted, setSubmitted] = useState(false)

  const sendApology = () => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 1400)
  }

  return (
    <WellnessBoardShell title="Apology Corner" subtitle="Repair with gentleness" badge="sorry">
      <View style={styles.list}>
        {templates.map((template) => (
          <Pressable key={template} onPress={() => setDraft(template)} style={styles.templateItem}>
            <Text style={styles.templateText}>{template}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder="Write your own apology..."
        placeholderTextColor="#8f8393"
        multiline
        numberOfLines={4}
        style={[styles.input, styles.textArea]}
      />

      <Pressable onPress={sendApology} style={styles.button}>
        <Text style={styles.buttonText}>{submitted ? 'Sent with love' : 'Send apology'}</Text>
      </Pressable>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    marginBottom: 12,
  },
  templateItem: {
    backgroundColor: '#1d1d2a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2f3346',
    padding: 12,
  },
  templateText: {
    color: '#e7dbe7',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#121821',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31384c',
    color: '#f5edf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  button: {
    marginTop: 12,
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
