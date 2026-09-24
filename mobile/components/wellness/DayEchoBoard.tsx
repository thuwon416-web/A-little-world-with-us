import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'

type EchoItem = {
  id: string
  title: string
  tone: 'warm' | 'easy' | 'lingering' | 'carry'
  done: boolean
}

const starterItems: EchoItem[] = [
  {
    id: 'echo-1',
    title: 'The moment your smile made the room feel lighter',
    tone: 'warm',
    done: true,
  },
  {
    id: 'echo-2',
    title: 'A conversation that felt easy without being forced',
    tone: 'easy',
    done: false,
  },
  { id: 'echo-3', title: 'The feeling I want to carry into tomorrow', tone: 'carry', done: true },
]

const toneMeta: Record<
  EchoItem['tone'],
  { label: string; style: { backgroundColor: string; borderColor: string } }
> = {
  warm: { label: 'warm', style: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' } },
  easy: { label: 'easy', style: { backgroundColor: '#171d29', borderColor: '#b7c3f0' } },
  lingering: { label: 'lingering', style: { backgroundColor: '#1b1d21', borderColor: '#b0d8c5' } },
  carry: { label: 'carry', style: { backgroundColor: '#2a2131', borderColor: '#d8b9c8' } },
}

const prompts = [
  'What feeling from today still lingers in the softest way?',
  'What part of the day felt easy enough to be remembered?',
  'What moment do you want to carry with you for longer?',
  'What small warmth deserves a second visit tomorrow?',
]

export default function DayEchoBoard() {
  const { colors } = useTheme()
  const [items, setItems] = useState<EchoItem[]>(starterItems)
  const [title, setTitle] = useState('')
  const [tone, setTone] = useState<EchoItem['tone']>('warm')
  const [promptIndex, setPromptIndex] = useState(0)

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const styles = useMemo(() => createStyles(colors), [colors])

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
      { id: `echo-${Date.now()}`, title: value, tone, done: false },
    ])
    setTitle('')
  }

  const rotatePrompt = () => {
    setPromptIndex((current) => (current + 1) % prompts.length)
  }

  return (
    <WellnessBoardShell title="Day Echo" subtitle="Echo meter" badge="echo">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Echo meter</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.count}>
          {doneCount}/{items.length}
        </Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => toggleItem(item.id)}
            style={[styles.item, item.done && styles.itemDone]}
          >
            <View style={styles.itemInner}>
              <View
                style={[
                  styles.pill,
                  toneMeta[item.tone].style,
                  { backgroundColor: colors.accent3, borderColor: colors.accent1 },
                ]}
              >
                <Text style={styles.pillText}>{toneMeta[item.tone].label}</Text>
              </View>
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.title}</Text>
            </View>
            <Text style={styles.itemState}>{item.done ? 'done' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <View style={styles.optionRow}>
          {(['warm', 'easy', 'lingering', 'carry'] as EchoItem['tone'][]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setTone(option)}
              style={[styles.option, option === tone && styles.optionSelected]}
            >
              <Text style={[styles.optionText, option === tone && styles.optionTextSelected]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Capture a lingering feeling"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.promptCard}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptLabel}>Echo prompt</Text>
          <Pressable onPress={rotatePrompt} style={styles.shuffleButton}>
            <Text style={styles.shuffleText}>Next</Text>
          </Pressable>
        </View>
        <Text style={styles.promptText}>{prompts[promptIndex]}</Text>
      </View>
    </WellnessBoardShell>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    progressCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 14,
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
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    progressValue: { color: colors.accent2, fontSize: 11, fontWeight: '700' },
    barTrack: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: 999,
      overflow: 'hidden',
      marginBottom: 6,
    },
    barFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent1 },
    count: { color: colors.textSecondary, fontSize: 11 },
    list: { gap: 10, marginBottom: 14 },
    item: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 14,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    itemDone: { backgroundColor: colors.cardBg, borderColor: colors.accent1 },
    itemInner: { flex: 1, gap: 8 },
    pill: {
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    pillText: {
      color: colors.textPrimary,
      fontSize: 9,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    itemText: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
    itemTextDone: { opacity: 0.7, textDecorationLine: 'line-through' },
    itemState: {
      color: colors.textSecondary,
      fontSize: 9,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    form: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 14,
    },
    optionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    option: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: 8,
      alignItems: 'center',
    },
    optionSelected: { backgroundColor: colors.cardBg, borderColor: colors.accent1 },
    optionText: {
      color: colors.textSecondary,
      fontSize: 9,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    optionTextSelected: { color: colors.accent2 },
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
    buttonText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
    promptCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.accent1,
    },
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
    shuffleButton: {
      backgroundColor: colors.cardBg,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    shuffleText: {
      color: colors.textPrimary,
      fontSize: 9,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    promptText: { color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  })
