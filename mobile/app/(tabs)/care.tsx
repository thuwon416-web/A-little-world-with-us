import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { saveTodayCareLog } from '@/services/care'

const moods = ['Calm', 'Happy', 'Energetic', 'Frisky', 'Mood swings', 'Irritated', 'Sad', 'Anxious', 'Low energy']
const symptoms = ['Everything is fine', 'Cramps', 'Tender breasts', 'Headache', 'Acne', 'Backache', 'Fatigue', 'Cravings', 'Insomnia', 'Abdominal pain', 'Hot flashes']
const sexOptions = ["Didn't have sex", 'Protected sex', 'Unprotected sex', 'Oral sex', 'Anal sex', 'Masturbation', 'Sensual touch', 'Sex toys', 'Orgasm', 'No orgasm', 'High sex drive', 'Neutral sex drive', 'Low sex drive']
const dischargeOptions = ['No discharge', 'Creamy', 'Watery', 'Sticky', 'Egg white', 'Spotting', 'Unusual']
const activities = ["Didn't exercise", 'Yoga', 'Gym', 'Aerobics & dancing', 'Swimming', 'Team sports', 'Running', 'Cycling', 'Walking']

function Chips({ options, selected, onToggle, tone = 'pink' }: { options: string[]; selected: string[]; onToggle: (value: string) => void; tone?: 'pink' | 'purple' | 'green' }) {
  return <View style={styles.chips}>{options.map((option) => <TouchableOpacity key={option} onPress={() => onToggle(option)} style={[styles.chip, tone === 'purple' && styles.purpleChip, tone === 'green' && styles.greenChip, selected.includes(option) && styles.chipSelected]}><Text style={[styles.chipText, selected.includes(option) && styles.chipTextSelected]}>{option}</Text></TouchableOpacity>)}</View>
}

export default function CareScreen() {
  const [mood, setMood] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [sex, setSex] = useState<string[]>([])
  const [otherTags, setOtherTags] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const toggle = (current: string[], value: string, setter: (next: string[]) => void) => setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])

  const saveCheckIn = async (periodStarted = false) => {
    try {
      setSaving(true)
      await saveTodayCareLog({ mood: mood || undefined, symptoms: selectedSymptoms, sex, otherTags, activities: selectedActivities, periodStarted })
      Alert.alert('Saved for both of you', 'This shared Care entry is now visible to your linked partner.')
    } catch (error) {
      Alert.alert('Unable to save', error instanceof Error ? error.message : 'Please try again.')
    } finally { setSaving(false) }
  }

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>CYCLE CARE · SHARED WITH YOUR PARTNER</Text><Text style={styles.title}>Today</Text>
    <View style={styles.hero}><Text style={styles.heroLabel}>PERIOD IN</Text><Text style={styles.days}>6 days</Text><Text style={styles.heroNote}>Low estimated chance of pregnancy</Text><Text style={styles.disclaimer}>Predictions are estimates, not medical advice.</Text></View>
    <View style={styles.actions}>{[['🩸', 'Log period'], ['＋', 'Symptoms'], ['♡', 'Intimacy']].map(([icon, label]) => <TouchableOpacity key={label} style={styles.action} onPress={() => label === 'Log period' ? void saveCheckIn(true) : undefined}><View style={styles.actionIcon}><Text style={styles.actionEmoji}>{icon}</Text></View><Text style={styles.actionLabel}>{label}</Text></TouchableOpacity>)}</View>
    <View style={styles.card}><Text style={styles.cardTitle}>How are you feeling?</Text><Chips options={moods} selected={mood ? [mood] : []} onToggle={(value) => setMood(mood === value ? '' : value)} tone="purple" /></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Symptoms</Text><Text style={styles.muted}>Choose everything you want to log today.</Text><Chips options={symptoms} selected={selectedSymptoms} onToggle={(value) => toggle(selectedSymptoms, value, setSelectedSymptoms)} /></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Sex and sex drive</Text><Text style={styles.muted}>Shared with your linked partner.</Text><Chips options={sexOptions} selected={sex} onToggle={(value) => toggle(sex, value, setSex)} /></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Discharge</Text><Chips options={dischargeOptions} selected={otherTags} onToggle={(value) => toggle(otherTags, value, setOtherTags)} tone="purple" /></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Physical activity</Text><Chips options={activities} selected={selectedActivities} onToggle={(value) => toggle(selectedActivities, value, setSelectedActivities)} tone="green" /></View>
    <TouchableOpacity disabled={saving} style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={() => void saveCheckIn()}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save shared daily log</Text>}</TouchableOpacity>
  </ScrollView>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff8f6' }, content: { padding: 20, paddingTop: 64, paddingBottom: 36 }, eyebrow: { color: '#927c82', fontWeight: '700', letterSpacing: 1.3, fontSize: 10 }, title: { color: '#241d22', fontWeight: '800', fontSize: 30, marginTop: 6 }, hero: { marginTop: 18, borderRadius: 28, padding: 28, alignItems: 'center', backgroundColor: '#fff0ed' }, heroLabel: { color: '#967d84', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, days: { color: '#241d22', fontWeight: '800', fontSize: 46, marginTop: 8 }, heroNote: { color: '#4c3c42', fontSize: 15, fontWeight: '600', marginTop: 12 }, disclaimer: { color: '#85747a', fontSize: 11, marginTop: 8 }, actions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 24 }, action: { alignItems: 'center', width: 92 }, actionIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#fff', elevation: 2 }, actionEmoji: { fontSize: 25 }, actionLabel: { color: '#3a2a31', fontSize: 12, fontWeight: '600', marginTop: 9, textAlign: 'center' }, card: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#f0e4e2' }, cardTitle: { color: '#241d22', fontSize: 19, fontWeight: '800' }, muted: { color: '#8c7b80', fontSize: 13, marginTop: 5 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }, chip: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#fff1f3' }, purpleChip: { backgroundColor: '#f6efff' }, greenChip: { backgroundColor: '#ecf8f1' }, chipSelected: { backgroundColor: '#ff5d89' }, chipText: { color: '#6e5960', fontWeight: '600', fontSize: 13 }, chipTextSelected: { color: '#fff' }, saveButton: { marginTop: 4, alignItems: 'center', borderRadius: 16, backgroundColor: '#ff5d89', paddingVertical: 15 }, saveButtonDisabled: { opacity: .6 }, saveText: { color: '#fff', fontWeight: '800' },
})
