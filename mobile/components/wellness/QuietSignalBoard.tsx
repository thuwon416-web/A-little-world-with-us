import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

type SignalItem = { id: string; message: string; signal: 'whisper' | 'gentle' | 'soft' | 'still'; done: boolean }

const starterItems: SignalItem[] = [
  { id: 'signal-1', message: 'A soft whisper that says we are still here for each other', signal: 'whisper', done: true },
  { id: 'signal-2', message: 'A gentle reminder that small gestures count as care', signal: 'gentle', done: false },
  { id: 'signal-3', message: 'A quiet signal of presence without needing grand gestures', signal: 'still', done: true },
]

const signalMeta: Record<SignalItem['signal'], { label: string; style: { backgroundColor: string; borderColor: string } }> = {
  whisper: { label: 'whisper', style: { backgroundColor: '#1a1d24', borderColor: '#d9e2ff' } },
  gentle: { label: 'gentle', style: { backgroundColor: '#2d2234', borderColor: '#d8b9c8' } },
  soft: { label: 'soft', style: { backgroundColor: '#171d29', borderColor: '#b7c3f0' } },
  still: { label: 'still', style: { backgroundColor: '#1c2129', borderColor: '#b0d8c5' } },
}

export default function QuietSignalBoard() {
  const [items, setItems] = useState<SignalItem[]>(starterItems)
  const [message, setMessage] = useState('')
  const [signal, setSignal] = useState<SignalItem['signal']>('whisper')

  const doneCount = useMemo(() => items.filter((item) => item.done).length, [items])
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const toggleItem = (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)))
  }

  const addItem = () => {
    const value = message.trim()
    if (!value) return

    setItems((current) => [...current, { id: `signal-${Date.now()}`, message: value, signal, done: false }])
    setMessage('')
  }

  return (
    <WellnessBoardShell title="Quiet Signal" subtitle="Signal count" badge="signal">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Signal count</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.count}>{doneCount}/{items.length}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => toggleItem(item.id)} style={[styles.item, item.done && styles.itemDone]}>
            <View style={styles.itemInner}>
              <View style={[styles.pill, signalMeta[item.signal].style]}>
                <Text style={styles.pillText}>{signalMeta[item.signal].label}</Text>
              </View>
              <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.message}</Text>
            </View>
            <Text style={styles.itemState}>{item.done ? 'sent' : 'later'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <View style={styles.optionRow}>
          {(['whisper', 'gentle', 'soft', 'still'] as SignalItem['signal'][]).map((option) => (
            <Pressable key={option} onPress={() => setSignal(option)} style={[styles.option, option === signal && styles.optionSelected]}>
              <Text style={[styles.optionText, option === signal && styles.optionTextSelected]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput value={message} onChangeText={setMessage} placeholder="Send a quiet signal" placeholderTextColor="#8f8393" style={styles.input} />
        <Pressable onPress={addItem} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.featureLabel}>Quiet wisdom</Text>
        <Text style={styles.featureText}>A whisper is enough when it comes from the heart. Small signals count as presence.</Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  progressCard: { backgroundColor: '#1a1b26', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#2f3346', marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { color: '#d5c6d5', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  progressValue: { color: '#f4cbd8', fontSize: 11, fontWeight: '700' },
  barTrack: { height: 8, backgroundColor: '#101721', borderRadius: 999, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#d5b0c7' },
  count: { color: '#c9bdcf', fontSize: 11 },
  list: { gap: 10, marginBottom: 14 },
  item: { backgroundColor: '#1d1d2a', borderWidth: 1, borderColor: '#2f3346', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  itemDone: { backgroundColor: '#241d2a', borderColor: '#d8b9c8' },
  itemInner: { flex: 1, gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { color: '#f4edf5', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  itemText: { color: '#e7dbe7', fontSize: 13, lineHeight: 18 },
  itemTextDone: { opacity: 0.7, textDecorationLine: 'line-through' },
  itemState: { color: '#d1bfd2', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  form: { backgroundColor: '#1a1b26', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#2f3346', marginBottom: 14 },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  option: { flex: 1, backgroundColor: '#101821', borderRadius: 999, borderWidth: 1, borderColor: '#31384c', paddingVertical: 8, alignItems: 'center' },
  optionSelected: { backgroundColor: '#2a2131', borderColor: '#d8b9c8' },
  optionText: { color: '#d7c5d7', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  optionTextSelected: { color: '#f5d5e5' },
  input: { backgroundColor: '#121821', borderRadius: 12, borderWidth: 1, borderColor: '#31384c', color: '#f5edf5', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  button: { backgroundColor: '#d5b0c7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#181821', fontWeight: '700', fontSize: 14 },
  featureCard: { backgroundColor: '#2a2131', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#d8b9c8' },
  featureLabel: { color: '#f0c9d9', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  featureText: { color: '#f5edf4', fontSize: 13, lineHeight: 18 },
})
