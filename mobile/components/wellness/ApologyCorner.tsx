import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'

const templates = [
  'I am sorry for the way I hurt you and for not being gentler with your feelings.',
  'I am sorry for the silence that made you feel alone. I want to do better with my words and my attention.',
  'I am sorry for making you feel unseen. I love you, and I want to repair this with patience and care.',
]

export default function ApologyCorner() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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
        placeholderTextColor={colors.textSecondary}
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      gap: 10,
      marginBottom: 12,
    },
    templateItem: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 12,
    },
    templateText: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      color: colors.textPrimary,
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
