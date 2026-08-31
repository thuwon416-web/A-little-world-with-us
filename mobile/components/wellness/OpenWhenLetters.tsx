import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

type Letter = {
  id: string
  title: string
  hint: string
  content: string
  opened: boolean
}

const defaultLetters: Letter[] = [
  {
    id: 'sad',
    title: 'Open when you are sad',
    hint: 'For the days the world feels heavy.',
    content:
      'Even on the hardest days, remember: my love for you is not a mood, it is a steady home. You are still deeply loved, even when everything feels loud.',
    opened: false,
  },
  {
    id: 'miss-you',
    title: 'Open when you miss me',
    hint: 'When your heart reaches for my side.',
    content:
      'I am missing you in the same quiet way the moon misses the sun. You are always carried in my thoughts, and my love for you does not depend on distance.',
    opened: false,
  },
  {
    id: 'fight',
    title: 'Open when we fight',
    hint: 'When the air feels sharp and the silence hurts.',
    content:
      'We are still us, even in the mess. We are allowed to be imperfect and still choose each other with softness. I love you more than the conflict, and I want us to come back gently.',
    opened: false,
  },
]

export default function OpenWhenLetters() {
  const [letters, setLetters] = useState<Letter[]>(defaultLetters)
  const [activeId, setActiveId] = useState<string | null>(defaultLetters[0]?.id ?? null)

  const activeLetter = useMemo(
    () => letters.find((letter) => letter.id === activeId) ?? letters[0] ?? null,
    [letters, activeId]
  )

  const toggleLetter = (id: string) => {
    setLetters((current) =>
      current.map((letter) => (letter.id === id ? { ...letter, opened: !letter.opened } : letter))
    )
    setActiveId(id)
  }

  if (!activeLetter) {
    return null
  }

  return (
    <WellnessBoardShell title="Open When Letters" subtitle="Pocket notes" badge="letters">
      <View style={styles.grid}>
        {letters.map((letter) => {
          const isActive = activeLetter.id === letter.id
          return (
            <Pressable
              key={letter.id}
              onPress={() => toggleLetter(letter.id)}
              style={[styles.letterCard, letter.opened && styles.letterOpen, isActive && styles.letterActive]}
            >
              <Text style={styles.letterTitle}>{letter.title}</Text>
              <Text style={styles.letterHint}>{letter.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.displayCard}>
        <Text style={styles.displayLabel}>{activeLetter.title}</Text>
        <Text style={styles.displayText}>{activeLetter.content}</Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  letterCard: {
    width: '31%',
    backgroundColor: '#1d1d2a',
    borderWidth: 1,
    borderColor: '#32324a',
    borderRadius: 14,
    padding: 10,
    minHeight: 92,
  },
  letterOpen: {
    backgroundColor: '#27263d',
  },
  letterActive: {
    borderColor: '#d8b9c8',
  },
  letterTitle: {
    color: '#f4edf5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  letterHint: {
    color: '#d7c7d6',
    fontSize: 10,
    lineHeight: 14,
  },
  displayCard: {
    backgroundColor: '#1e1f29',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#35364e',
  },
  displayLabel: {
    color: '#f0c9d9',
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  displayText: {
    color: '#f5edf4',
    fontSize: 13,
    lineHeight: 20,
  },
})
