import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { WellnessBoardShell } from './WellnessBoardShell'

type MoodId = 'blissful' | 'happy' | 'calm' | 'deep' | 'tired'

type MoodOption = {
  id: MoodId
  label: string
  backgroundColor: string
  borderColor: string
  textColor: string
}

const moodOptions: MoodOption[] = [
  { id: 'blissful', label: 'Blissful', backgroundColor: '#2d2234', borderColor: '#d8b9c8', textColor: '#f4cbd8' },
  { id: 'happy', label: 'Happy', backgroundColor: '#1d1d2a', borderColor: '#d8b9c8', textColor: '#f4edf5' },
  { id: 'calm', label: 'Calm', backgroundColor: '#191d28', borderColor: '#b7c3f0', textColor: '#d9e2ff' },
  { id: 'deep', label: 'Deep', backgroundColor: '#211d22', borderColor: '#f4c7a5', textColor: '#f8ddc2' },
  { id: 'tired', label: 'Tired', backgroundColor: '#1c2129', borderColor: '#b0d8c5', textColor: '#dfeee8' },
]

export default function CoupleMoodMeter() {
  const [selectedMood, setSelectedMood] = useState<MoodId>('blissful')
  const [intensity, setIntensity] = useState(72)
  const [note, setNote] = useState('')

  const currentMood = useMemo(
    () => moodOptions.find((mood) => mood.id === selectedMood) ?? moodOptions[0],
    [selectedMood]
  )

  return (
    <WellnessBoardShell title="Couple Mood Meter" subtitle="Today’s vibe" badge="mood">
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Today’s vibe</Text>
          <Text style={styles.progressValue}>{intensity}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${intensity}%` }]} />
        </View>
      </View>

      <View style={styles.grid}>
        {moodOptions.map((mood) => {
          const selected = selectedMood === mood.id

          return (
            <Pressable
              key={mood.id}
              onPress={() => setSelectedMood(mood.id)}
              style={[styles.option, selected && styles.optionSelected, { backgroundColor: mood.backgroundColor, borderColor: selected ? mood.borderColor : '#2f3346' }]}
            >
              <Text style={[styles.optionText, { color: mood.textColor }]}>{mood.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.sliderWrap}>
        <Text style={styles.sliderLabel}>Connection intensity</Text>
        <View style={styles.intensityControl}>
          <Pressable onPress={() => setIntensity(Math.max(0, intensity - 10))} style={styles.button}>
            <Text style={styles.buttonText}>−</Text>
          </Pressable>
          <Text style={styles.intensityValue}>{intensity}%</Text>
          <Pressable onPress={() => setIntensity(Math.min(100, intensity + 10))} style={styles.button}>
            <Text style={styles.buttonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="What made today feel this way?"
        placeholderTextColor="#8f8393"
        multiline
        numberOfLines={3}
        style={[styles.input, styles.textArea]}
      />

      <View style={styles.featureCard}>
        <Text style={styles.featureLabel}>Current feeling</Text>
        <Text style={styles.featureText}>{currentMood.label} energy is floating through the day — and that is enough to make it feel special.</Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  progressCard: { backgroundColor: '#1a1b26', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#2f3346', marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { color: '#d5c6d5', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  progressValue: { color: '#f4cbd8', fontSize: 11, fontWeight: '700' },
  barTrack: { height: 8, backgroundColor: '#101721', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#d5b0c7' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  option: { flexBasis: '31%', minWidth: 90, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  optionSelected: { borderWidth: 1 },
  optionText: { fontSize: 12, fontWeight: '600' },
  sliderWrap: { backgroundColor: '#1a1b26', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#2f3346', marginBottom: 14 },
  sliderLabel: { color: '#d5c6d5', fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8 },
  intensityControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  intensityValue: { color: '#f4cbd8', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  input: { backgroundColor: '#121821', borderRadius: 12, borderWidth: 1, borderColor: '#31384c', color: '#f5edf5', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, fontSize: 14 },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  button: { backgroundColor: '#d5b0c7', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#181821', fontWeight: '700', fontSize: 16 },
  featureCard: { backgroundColor: '#2a2131', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#d8b9c8' },
  featureLabel: { color: '#f0c9d9', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  featureText: { color: '#f5edf4', fontSize: 13, lineHeight: 18 },
})
