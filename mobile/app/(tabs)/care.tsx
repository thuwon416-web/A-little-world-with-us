import { useState } from 'react'
import { Droplets, Heart, Plus } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { saveTodayCareLog } from '@/services/care'

const moods = [
  'Calm',
  'Happy',
  'Energetic',
  'Frisky',
  'Mood swings',
  'Irritated',
  'Sad',
  'Anxious',
  'Low energy',
]
const symptoms = [
  'Everything is fine',
  'Cramps',
  'Tender breasts',
  'Headache',
  'Acne',
  'Backache',
  'Fatigue',
  'Cravings',
  'Insomnia',
  'Abdominal pain',
  'Hot flashes',
]
const sexOptions = [
  "Didn't have sex",
  'Protected sex',
  'Unprotected sex',
  'Oral sex',
  'Anal sex',
  'Masturbation',
  'Sensual touch',
  'Sex toys',
  'Orgasm',
  'No orgasm',
  'High sex drive',
  'Neutral sex drive',
  'Low sex drive',
]
const dischargeOptions = [
  'No discharge',
  'Creamy',
  'Watery',
  'Sticky',
  'Egg white',
  'Spotting',
  'Unusual',
]
const digestionOptions = ['Nausea', 'Bloating', 'Constipation', 'Diarrhea']
const pregnancyTestOptions = ["Didn't take test", 'Positive', 'Negative', 'Faint line']
const contraceptiveOptions = ['Taken on time', "Yesterday's pill", 'Missed pill']
const activities = [
  "Didn't exercise",
  'Yoga',
  'Gym',
  'Aerobics & dancing',
  'Swimming',
  'Team sports',
  'Running',
  'Cycling',
  'Walking',
]

function Chips({
  options,
  selected,
  onToggle,
  tone = 'pink',
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  tone?: 'pink' | 'purple' | 'green'
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onToggle(option)}
          style={[
            styles.chip,
            tone === 'purple' && styles.purpleChip,
            tone === 'green' && styles.greenChip,
            selected.includes(option) && styles.chipSelected,
          ]}
        >
          <Text style={[styles.chipText, selected.includes(option) && styles.chipTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function CareScreen() {
  const [activeTab, setActiveTab] = useState<'Today' | 'Insights' | 'Calendar' | 'Reminders' | 'Settings'>('Today')
  const [mood, setMood] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [sex, setSex] = useState<string[]>([])
  const [discharge, setDischarge] = useState<string[]>([])
  const [digestion, setDigestion] = useState<string[]>([])
  const [pregnancyTest, setPregnancyTest] = useState<string[]>([])
  const [contraceptives, setContraceptives] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [waterIntake, setWaterIntake] = useState('')
  const [weight, setWeight] = useState('')
  const [basalTemp, setBasalTemp] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const toggle = (current: string[], value: string, setter: (next: string[]) => void) =>
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])

  const saveCheckIn = async (periodStarted = false) => {
    try {
      setSaving(true)
      await saveTodayCareLog({
        mood: mood || undefined,
        symptoms: selectedSymptoms,
        sex,
        discharge,
        digestion,
        pregnancyTest,
        contraceptives,
        activities: selectedActivities,
        waterIntake: waterIntake ? Number(waterIntake) : undefined,
        weight: weight ? Number(weight) : undefined,
        basalTemp: basalTemp ? Number(basalTemp) : undefined,
        notes: notes || undefined,
        periodStarted,
      })
      Alert.alert(
        'Saved for both of you',
        'This shared Care entry is now visible to your linked partner.'
      )
    } catch (error) {
      Alert.alert('Unable to save', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }

    if (activeTab !== 'Today') {
      return (
        <View style={[styles.screen, styles.parityScreen]}>
          <Text style={styles.eyebrow}>CYCLE CARE</Text>
          <Text style={styles.title}>{activeTab}</Text>
          <Text style={styles.heroNote}>
            {activeTab === 'Insights'
              ? 'Your cycle insights will appear after a few period logs.'
              : activeTab === 'Calendar'
                ? 'Your logged and predicted cycle days will appear here.'
                : activeTab === 'Reminders'
                  ? 'Gentle care reminders can be configured here.'
                  : 'Cycle settings and privacy controls are kept here.'}
          </Text>
          <TouchableOpacity style={styles.saveButton} onPress={() => setActiveTab('Today')}>
            <Text style={styles.saveText}>Back to Today</Text>
          </TouchableOpacity>
        </View>
      )
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CYCLE CARE · SHARED WITH YOUR PARTNER</Text>
      <Text style={styles.title}>Today</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {(['Today', 'Insights', 'Calendar', 'Reminders', 'Settings'] as const).map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>SHARED CYCLE</Text>
        <Text style={styles.days}>Log a period</Text>
        <Text style={styles.heroNote}>A forecast appears after period history is recorded.</Text>
        <Text style={styles.disclaimer}>Predictions are estimates, not medical advice.</Text>
      </View>
      <View style={styles.actions}>
        {[
          ['period', 'Log period'],
          ['symptoms', 'Symptoms'],
          ['intimacy', 'Intimacy'],
        ].map(([icon, label]) => (
          <TouchableOpacity
            key={label}
            style={styles.action}
            onPress={() => (label === 'Log period' ? void saveCheckIn(true) : undefined)}
          >
            <View style={styles.actionIcon}>
              {icon === 'period' ? <Droplets color="#ff9b9b" size={25} /> : icon === 'symptoms' ? <Plus color="#ff9b9b" size={25} /> : <Heart color="#ff9b9b" size={25} />}
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How are you feeling?</Text>
        <Chips
          options={moods}
          selected={mood ? [mood] : []}
          onToggle={(value) => setMood(mood === value ? '' : value)}
          tone="purple"
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Symptoms</Text>
        <Text style={styles.muted}>Choose everything you want to log today.</Text>
        <Chips
          options={symptoms}
          selected={selectedSymptoms}
          onToggle={(value) => toggle(selectedSymptoms, value, setSelectedSymptoms)}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sex and sex drive</Text>
        <Text style={styles.muted}>Shared with your linked partner.</Text>
        <Chips
          options={sexOptions}
          selected={sex}
          onToggle={(value) => toggle(sex, value, setSex)}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Discharge</Text>
        <Chips
          options={dischargeOptions}
          selected={discharge}
          onToggle={(value) => toggle(discharge, value, setDischarge)}
          tone="purple"
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Digestion & stool</Text>
        <Chips
          options={digestionOptions}
          selected={digestion}
          onToggle={(value) => toggle(digestion, value, setDigestion)}
          tone="purple"
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pregnancy test</Text>
        <Chips
          options={pregnancyTestOptions}
          selected={pregnancyTest}
          onToggle={(value) => toggle(pregnancyTest, value, setPregnancyTest)}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contraceptives</Text>
        <Chips
          options={contraceptiveOptions}
          selected={contraceptives}
          onToggle={(value) => toggle(contraceptives, value, setContraceptives)}
          tone="green"
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Physical activity</Text>
        <Chips
          options={activities}
          selected={selectedActivities}
          onToggle={(value) => toggle(selectedActivities, value, setSelectedActivities)}
          tone="green"
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily details</Text>
        <View style={styles.inputs}>
          <TextInput
            value={waterIntake}
            onChangeText={setWaterIntake}
            placeholder="Water (ml)"
            placeholderTextColor="#bcaed1"
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="Weight (kg)"
            placeholderTextColor="#bcaed1"
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <TextInput
            value={basalTemp}
            onChangeText={setBasalTemp}
            placeholder="Basal temp (°C)"
            placeholderTextColor="#bcaed1"
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes for today"
          placeholderTextColor="#bcaed1"
          multiline
          style={[styles.input, styles.notes]}
        />
      </View>
      <TouchableOpacity
        disabled={saving}
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={() => void saveCheckIn()}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Save shared daily log</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#1A0B2E' },
  parityScreen: { padding: 20, paddingTop: 64 },
  content: { padding: 20, paddingTop: 64, paddingBottom: 36 },
  eyebrow: { color: '#c9b9dd', fontWeight: '700', letterSpacing: 1.3, fontSize: 10 },
  title: { color: '#fff8ff', fontWeight: '800', fontSize: 30, marginTop: 6 },
  hero: {
    marginTop: 18,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#2d1b4e',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  heroLabel: { color: '#c9b9dd', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  days: { color: '#FFD700', fontWeight: '800', fontSize: 38, marginTop: 8 },
  heroNote: {
    color: '#f7eaf4',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  disclaimer: { color: '#c9b9dd', fontSize: 11, marginTop: 8, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 24 },
  action: { alignItems: 'center', width: 92 },
  actionIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#32184f',
    borderWidth: 1,
    borderColor: '#ff6b9d80',
  },
  actionEmoji: { fontSize: 25 },
  tabRow: { gap: 8, paddingVertical: 16 },
  tab: { borderRadius: 16, backgroundColor: '#39235a', paddingHorizontal: 14, paddingVertical: 9 },
  tabActive: { backgroundColor: '#ff5d89' },
  tabText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  actionLabel: {
    color: '#f7eaf4',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 9,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2d1b4e',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff1a',
  },
  cardTitle: { color: '#fff8ff', fontSize: 19, fontWeight: '800' },
  muted: { color: '#c9b9dd', fontSize: 13, marginTop: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: '#40245f' },
  purpleChip: { backgroundColor: '#39235a' },
  greenChip: { backgroundColor: '#184c45' },
  chipSelected: { backgroundColor: '#ff5d89' },
  chipText: { color: '#f0e7f7', fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: '#fff' },
  inputs: { gap: 10, marginTop: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff24',
    backgroundColor: '#1f1037',
    color: '#fff8ff',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  notes: { marginTop: 10, minHeight: 82, textAlignVertical: 'top' },
  saveButton: {
    marginTop: 4,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#ff5d89',
    paddingVertical: 15,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '800' },
})
