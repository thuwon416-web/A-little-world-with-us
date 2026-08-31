import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

type Tone = 'warm' | 'deep' | 'playful' | 'grounded'

type Affirmation = {
  id: string
  text: string
  tone: Tone
}

const starterAffirmations: Affirmation[] = [
  { id: 'a1', text: 'You are my favorite place to return to.', tone: 'warm' },
  { id: 'a2', text: 'The way you love me makes life feel gentler.', tone: 'deep' },
  { id: 'a3', text: 'Even the ordinary moments feel beautiful with you in them.', tone: 'playful' },
]

const toneStyles: Record<Tone, { backgroundColor: string; borderColor: string }> = {
  warm: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' },
  deep: { backgroundColor: '#191d28', borderColor: '#8ea0d8' },
  playful: { backgroundColor: '#211c24', borderColor: '#f4c7a5' },
  grounded: { backgroundColor: '#1a2129', borderColor: '#b0d8c5' },
}

export default function AffirmationDeck() {
  const [items] = useState<Affirmation[]>(starterAffirmations)
  const [selectedId, setSelectedId] = useState(starterAffirmations[0]?.id ?? '')

  const active = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId]
  )

  return (
    <WellnessBoardShell title="Affirmation Deck" subtitle="Today’s reminder" badge="warm">
      <View style={styles.stack}>
        {items.map((item) => {
          const selected = selectedId === item.id
          return (
            <Pressable
              key={item.id}
              onPress={() => setSelectedId(item.id)}
              style={[styles.cardItem, selected && styles.cardItemSelected]}
            >
              <Text style={styles.itemText}>{item.text}</Text>
              <View style={[styles.pill, toneStyles[item.tone]]}>
                <Text style={styles.pillText}>{item.tone}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.featureLabel}>Today’s reminder</Text>
        <Text style={styles.featureText}>{active?.text ?? 'You are loved, even in the quiet moments.'}</Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  cardItem: {
    backgroundColor: '#1d1d2a',
    borderWidth: 1,
    borderColor: '#313146',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardItemSelected: {
    borderColor: '#d8b9c8',
    backgroundColor: '#242333',
  },
  itemText: {
    color: '#f4edf5',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
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
  featureCard: {
    marginTop: 14,
    backgroundColor: '#2b2130',
    borderRadius: 14,
    padding: 12,
  },
  featureLabel: {
    color: '#f0c9d9',
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featureText: {
    color: '#f5edf4',
    fontSize: 14,
    lineHeight: 20,
  },
})
