import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const quickActions = [
  ['🩸', 'Log period'],
  ['＋', 'Symptoms'],
  ['♡', 'Intimacy'],
] as const

const symptoms = ['Cramps', 'Headache', 'Fatigue', 'Cravings', 'Mood swings', 'Bloating']

export default function CareScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) => current.includes(symptom)
      ? current.filter((item) => item !== symptom)
      : [...current, symptom])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CYCLE CARE</Text>
      <Text style={styles.title}>Today</Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>PERIOD IN</Text>
        <Text style={styles.days}>6 days</Text>
        <Text style={styles.heroNote}>Low estimated chance of pregnancy</Text>
        <Text style={styles.disclaimer}>Predictions are estimates, not medical advice.</Text>
      </View>

      <View style={styles.actions}>
        {quickActions.map(([icon, label]) => (
          <TouchableOpacity key={label} style={styles.action} onPress={() => Alert.alert(label, 'Your daily log is ready to record this privately.')}>
            <View style={styles.actionIcon}><Text style={styles.actionEmoji}>{icon}</Text></View>
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}><Text style={styles.cardTitle}>Cycle history</Text><Text style={styles.link}>See all ›</Text></View>
        <Text style={styles.currentCycle}>Current cycle: 21 days</Text>
        <Text style={styles.muted}>Started Aug 17</Text>
        <View style={styles.dots}>{Array.from({ length: 28 }, (_, index) => <View key={index} style={[styles.dot, index < 5 ? styles.periodDot : index < 16 ? styles.fertileDot : styles.neutralDot]} />)}</View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How are you feeling?</Text>
        <Text style={styles.muted}>Choose anything you want to log today.</Text>
        <View style={styles.chips}>
          {symptoms.map((symptom) => {
            const selected = selectedSymptoms.includes(symptom)
            return <TouchableOpacity key={symptom} onPress={() => toggleSymptom(symptom)} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{symptom}</Text></TouchableOpacity>
          })}
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={() => Alert.alert('Saved', 'Your private daily check-in was saved.')}><Text style={styles.saveText}>Save today&apos;s check-in</Text></TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff8f6' }, content: { padding: 20, paddingTop: 64, paddingBottom: 36 },
  eyebrow: { color: '#927c82', fontWeight: '700', letterSpacing: 2, fontSize: 11 }, title: { color: '#241d22', fontWeight: '800', fontSize: 30, marginTop: 6 },
  hero: { marginTop: 18, borderRadius: 28, padding: 28, alignItems: 'center', backgroundColor: '#fff0ed' }, heroLabel: { color: '#967d84', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, days: { color: '#241d22', fontWeight: '800', fontSize: 46, marginTop: 8 }, heroNote: { color: '#4c3c42', fontSize: 15, fontWeight: '600', marginTop: 12 }, disclaimer: { color: '#85747a', fontSize: 11, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 24 }, action: { alignItems: 'center', width: 92 }, actionIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#fff', shadowColor: '#dba9b3', shadowOpacity: .2, shadowRadius: 10, elevation: 2 }, actionEmoji: { fontSize: 25 }, actionLabel: { color: '#3a2a31', fontSize: 12, fontWeight: '600', marginTop: 9, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#f0e4e2' }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardTitle: { color: '#241d22', fontSize: 19, fontWeight: '800' }, link: { color: '#ef5d85', fontWeight: '700' }, currentCycle: { color: '#241d22', fontSize: 16, fontWeight: '700', marginTop: 18 }, muted: { color: '#8c7b80', fontSize: 13, marginTop: 5 }, dots: { flexDirection: 'row', gap: 4, marginTop: 16 }, dot: { flex: 1, height: 8, borderRadius: 5 }, periodDot: { backgroundColor: '#ff5d89' }, fertileDot: { backgroundColor: '#a9ddd8' }, neutralDot: { backgroundColor: '#eee9e8' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }, chip: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#fff1f3' }, chipSelected: { backgroundColor: '#ff5d89' }, chipText: { color: '#6e5960', fontWeight: '600', fontSize: 13 }, chipTextSelected: { color: '#fff' }, saveButton: { marginTop: 18, alignItems: 'center', borderRadius: 16, backgroundColor: '#ff5d89', paddingVertical: 14 }, saveText: { color: '#fff', fontWeight: '800' },
})
