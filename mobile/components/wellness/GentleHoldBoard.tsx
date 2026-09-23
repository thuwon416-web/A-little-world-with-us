import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'

type HoldItem = {
  id: string
  title: string
  tone: 'hold' | 'warmth' | 'ease' | 'calm'
  done: boolean
}

const starterItems: HoldItem[] = [
  {
    id: 'hold-1',
    title: 'Leave a little room for the feelings to settle',
    tone: 'hold',
    done: true,
  },
  {
    id: 'hold-2',
    title: 'Offer one real comfort instead of a quick fix',
    tone: 'warmth',
    done: false,
  },
  { id: 'hold-3', title: 'Keep the space gentle enough to breathe', tone: 'calm', done: true },
]

const toneMeta: Record<
  HoldItem['tone'],
  { label: string; backgroundColor: string; borderColor: string; color: string }
> = {
  hold: { label: 'hold', backgroundColor: '#201d29', borderColor: '#d8b9c8', color: '#f4edf5' },
  warmth: { label: 'warmth', backgroundColor: '#201d29', borderColor: '#d8b9c8', color: '#f0c9d9' },
  ease: { label: 'ease', backgroundColor: '#2b2a22', borderColor: '#f3d59c', color: '#f5eacf' },
  calm: { label: 'calm', backgroundColor: '#1b2129', borderColor: '#b7d7c8', color: '#edf8f2' },
}

const prompts = [
  'What kind of support feels steady without becoming heavy?',
  'Which soft action tells the other person they are not alone in the moment?',
  'What helps the room feel safe enough for tenderness?',
  'How can we hold each other without forcing the moment to be solved?',
]

export default function GentleHoldBoard() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [items, setItems] = useState<HoldItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [tone, setTone] = useState<HoldItem['tone']>('hold')
  const [promptIndex, setPromptIndex] = useState(0)

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const addItem = () => {
    const value = title.trim()
    if (!value) return

    setItems((current) => [
      ...current,
      { id: `hold-${Date.now()}`, title: value, tone, done: false },
    ])
    setTitle('')
  }

  const rotatePrompt = () => setPromptIndex((current) => (current + 1) % prompts.length)

  return (
    <WellnessBoardShell title="Gentle Hold" subtitle="Support rhythm" badge="hold">
      <View style={styles.progressBox}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Support rhythm</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item) => {
          const meta = toneMeta[item.tone]
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              style={[styles.item, item.done && styles.itemDone]}
            >
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: meta.backgroundColor, borderColor: meta.borderColor },
                  ]}
                >
                  <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
                  {item.title}
                </Text>
              </View>
              <Text style={styles.itemState}>{item.done ? 'held' : 'later'}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.form}>
        <View style={styles.toneRow}>
          {(['hold', 'warmth', 'ease', 'calm'] as HoldItem['tone'][]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setTone(option)}
              style={[styles.modeButton, tone === option && styles.modeButtonActive]}
            >
              <Text style={[styles.modeText, tone === option && styles.modeTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add a holding cue"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add cue</Text>
        </Pressable>
      </View>

      <View style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptLabel}>Prompt</Text>
          <Pressable onPress={rotatePrompt} style={styles.promptButton}>
            <Text style={styles.promptButtonText}>Next</Text>
          </Pressable>
        </View>
        <Text style={styles.promptText}>{prompts[promptIndex]}</Text>
      </View>
    </WellnessBoardShell>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    progressBox: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    progressValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
    progressTrack: {
      height: 10,
      backgroundColor: colors.surface,
      borderRadius: 999,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: colors.accent1, borderRadius: 999 },
    list: { gap: 10, marginBottom: 12 },
    item: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 14,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    itemDone: { backgroundColor: colors.cardBg },
    pill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    pillText: { fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: '700' },
    itemText: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
    itemTextDone: { textDecorationLine: 'line-through', opacity: 0.7 },
    itemState: {
      color: colors.textSecondary,
      fontSize: 9,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginTop: 4,
    },
    form: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 12,
    },
    toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    modeButton: {
      flexBasis: '22%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    modeButtonActive: { borderColor: colors.accent1, backgroundColor: colors.cardBg },
    modeText: {
      color: colors.textPrimary,
      fontSize: 10,
      letterSpacing: 1.0,
      textTransform: 'uppercase',
    },
    modeTextActive: { color: colors.textPrimary },
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
    button: {
      backgroundColor: colors.accent1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    buttonText: { color: colors.background, fontWeight: '700', fontSize: 14 },
    promptCard: { backgroundColor: colors.cardBg, borderRadius: 14, padding: 12 },
    promptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    promptLabel: {
      color: colors.accent2,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    promptButton: {
      backgroundColor: colors.accent1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    promptButtonText: {
      color: colors.background,
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    promptText: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  })
