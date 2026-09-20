import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'

import { WellnessBoardShell } from './WellnessBoardShell'

const starterEntries = [
  'I am grateful for the way you make even ordinary mornings feel warm.',
  'I love how safe and seen I feel when I am with you.',
  'Thank you for being gentle with my heart and patient with my growth.',
]

export default function GratitudeWall() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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
          placeholderTextColor={colors.textSecondary}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  list: {
    gap: 10,
    marginBottom: 14,
  },
  entry: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  entryText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.textPrimary,
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
    backgroundColor: colors.accent1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
})
