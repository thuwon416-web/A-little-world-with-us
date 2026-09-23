import AsyncStorage from '@react-native-async-storage/async-storage'
import { Sparkles } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'
import {
  saveTodayCareLog,
  saveCareLogForDate,
  getCareData,
  saveCareSettings,
  type CareLog,
  type CareSettings,
} from '@/services/care'
import {
  addDays,
  calculateNativeCycleSummary,
  dateKey,
  type NativeCycleSummary,
} from '@/services/cycleCalculator'

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
const pregnancyOptions = ["Didn't take test", 'Positive', 'Negative', 'Faint line']
const contraceptionOptions = ['Taken on time', "Yesterday's pill", 'Missed pill']
const activityOptions = [
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
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          accessibilityRole="checkbox"
          accessibilityLabel={option}
          accessibilityState={{ checked: selected.includes(option) }}
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

function Card({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Insights({
  logs,
  summary,
  savedCycleLength,
}: {
  logs: CareLog[]
  summary: NativeCycleSummary
  savedCycleLength: number
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const moodCounts = useMemo(
    () =>
      Object.entries(
        logs.reduce<Record<string, number>>((counts, log) => {
          if (log.mood) counts[log.mood] = (counts[log.mood] ?? 0) + 1
          return counts
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [logs]
  )
  const symptomCounts = useMemo(
    () =>
      Object.entries(
        logs
          .flatMap((log) => log.symptoms ?? [])
          .reduce<Record<string, number>>((counts, symptom) => {
            counts[symptom] = (counts[symptom] ?? 0) + 1
            return counts
          }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [logs]
  )
  const maxMood = Math.max(1, ...moodCounts.map(([, count]) => count))
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CYCLE CARE</Text>
      <Text style={styles.title}>Insights</Text>
      <Card title="Cycle statistics">
        <View style={styles.statGrid}>
          <Stat label="Calculated average" value={`${summary.cycleLength} days`} />
          <Stat label="Saved setting" value={`${savedCycleLength} days`} />
          <Stat label="Variation" value={`${summary.variationMin}-${summary.variationMax} days`} />
          <Stat label="Regularity" value={summary.regular ? 'Regular' : 'Irregular'} />
          <Stat label="Period average" value={`${summary.periodLength} days`} />
        </View>
      </Card>
      <Card title="Mood trends">
        {moodCounts.length ? (
          moodCounts.map(([mood, count]) => (
            <View key={mood} style={styles.barRow}>
              <Text style={styles.barLabel}>{mood}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${(count / maxMood) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>Log moods to see your trend.</Text>
        )}
      </Card>
      <Card title="Most frequent symptoms">
        {symptomCounts.length ? (
          symptomCounts.map(([symptom, count]) => (
            <View key={symptom} style={styles.frequencyRow}>
              <Text style={styles.text}>{symptom}</Text>
              <Text style={styles.accentText}>{count} days</Text>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>Log symptoms to see patterns.</Text>
        )}
      </Card>
      <Card title="Cycle history">
        {summary.cycleHistory
          .slice(-6)
          .reverse()
          .map((cycle) => (
            <View key={`${cycle.startDate}-${cycle.status}`} style={styles.frequencyRow}>
              <Text style={styles.text}>
                {cycle.startDate} - {cycle.endDate}
              </Text>
              <Text style={styles.accentText}>
                {cycle.length}d · {cycle.status}
              </Text>
            </View>
          ))}
      </Card>
    </ScrollView>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  )
}

function Calendar({
  logs,
  summary,
  onLog,
}: {
  logs: CareLog[]
  summary: NativeCycleSummary
  onLog: (date: string) => void
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const [month, setMonth] = useState(new Date())
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const periodDays = new Set(logs.filter((log) => log.periodDay).map((log) => log.logDate))
  const monthName = month.toLocaleDateString([], { month: 'long', year: 'numeric' })
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CYCLE CARE</Text>
      <Text style={styles.title}>Calendar</Text>
      <Card title={monthName}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}>
            <Text style={styles.nav}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>{monthName}</Text>
          <TouchableOpacity onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}>
            <Text style={styles.nav}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.weekRow}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: firstDay }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1
            const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const actual = periodDays.has(date)
            const predicted = Boolean(
              summary.nextPeriodStart &&
              date >= summary.nextPeriodStart &&
              date < addDays(summary.nextPeriodStart, summary.periodLength)
            )
            const fertile = Boolean(
              summary.fertileStart &&
              summary.fertileEnd &&
              date >= summary.fertileStart &&
              date <= summary.fertileEnd
            )
            const ovulation = date === summary.ovulationDate
            const today = date === dateKey(new Date())
            return (
              <TouchableOpacity
                key={date}
                onPress={() => onLog(date)}
                style={[
                  styles.dayCell,
                  actual && styles.periodDay,
                  predicted && styles.predictedDay,
                  fertile && styles.fertileDay,
                  ovulation && styles.ovulationDay,
                  today && styles.todayDay,
                ]}
              >
                <Text style={styles.dayText}>{day}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>● Period</Text>
          <Text style={styles.legendText}>◌ Predicted</Text>
          <Text style={styles.legendText}>● Fertile</Text>
          <Text style={styles.legendText}>● Ovulation</Text>
        </View>
      </Card>
      <Card title="Forecast">
        <Text style={styles.text}>
          {summary.nextPeriodStart
            ? `Next period: ${summary.nextPeriodStart}`
            : 'Log at least one period to begin forecasting.'}
        </Text>
        <Text style={styles.muted}>
          {summary.day ? `Today is cycle day ${summary.day}.` : 'Tap a date to log a period day.'}
        </Text>
      </Card>
    </ScrollView>
  )
}

function Reminders() {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const [enabled, setEnabled] = useState({
    period: true,
    fertile: true,
    ovulation: true,
    daily: true,
  })
  const [time, setTime] = useState('09:00')
  useEffect(() => {
    void AsyncStorage.getItem('care.reminders')
      .then((value) => {
        if (!value) return
        const saved = JSON.parse(value) as { enabled?: typeof enabled; time?: string }
        if (saved.enabled) setEnabled(saved.enabled)
        if (saved.time) setTime(saved.time)
      })
      .catch((error) => console.error('Unable to load Care reminders', error))
  }, [])
  const persist = (nextEnabled: typeof enabled, nextTime: string) => {
    void AsyncStorage.setItem(
      'care.reminders',
      JSON.stringify({ enabled: nextEnabled, time: nextTime })
    ).catch((error) => console.error('Unable to save Care reminders', error))
  }
  const toggle = (key: keyof typeof enabled) =>
    setEnabled((current) => {
      const next = { ...current, [key]: !current[key] }
      persist(next, time)
      return next
    })
  const updateTime = (next: string) => {
    setTime(next)
    persist(enabled, next)
  }
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>CYCLE CARE</Text>
      <Text style={styles.title}>Reminders</Text>
      <Card title="Smart reminders">
        <Reminder
          label="Period coming soon (2 days before)"
          value={enabled.period}
          onChange={() => toggle('period')}
        />
        <Reminder
          label="Fertile window starting"
          value={enabled.fertile}
          onChange={() => toggle('fertile')}
        />
        <Reminder
          label="Ovulation expected"
          value={enabled.ovulation}
          onChange={() => toggle('ovulation')}
        />
        <Reminder
          label="Log mood and symptoms daily"
          value={enabled.daily}
          onChange={() => toggle('daily')}
        />
      </Card>
      <Card title="Notification time">
        <Text style={styles.muted}>Choose when daily reminders are delivered.</Text>
        <TextInput
          value={time}
          onChangeText={updateTime}
          placeholder="09:00"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
      </Card>
    </ScrollView>
  )
}

function Reminder({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: () => void
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={styles.reminder}>
      <Text style={styles.text}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        accessibilityHint="Toggles this reminder"
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cardBorder, true: colors.accent1 }}
      />
    </View>
  )
}

function HealthProfile() {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const [profile, setProfile] = useState({
    age: '',
    weight: '',
    height: '',
    conditions: '',
    medications: '',
  })
  useEffect(() => {
    void AsyncStorage.getItem('care.healthProfile')
      .then((value) => {
        if (value) setProfile(JSON.parse(value) as typeof profile)
      })
      .catch((error) => console.error('Unable to load health profile', error))
  }, [])
  const update = (key: keyof typeof profile, value: string) =>
    setProfile((current) => {
      const next = { ...current, [key]: value }
      void AsyncStorage.setItem('care.healthProfile', JSON.stringify(next)).catch((error) =>
        console.error('Unable to save health profile', error)
      )
      return next
    })
  return (
    <Card title="Health profile">
      <TextInput
        value={profile.age}
        onChangeText={(value) => update('age', value)}
        placeholder="Age"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        value={profile.weight}
        onChangeText={(value) => update('weight', value)}
        placeholder="Weight (kg)"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={profile.height}
        onChangeText={(value) => update('height', value)}
        placeholder="Height (cm)"
        placeholderTextColor={colors.textSecondary}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        value={profile.conditions}
        onChangeText={(value) => update('conditions', value)}
        placeholder="Medical conditions"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
      <TextInput
        value={profile.medications}
        onChangeText={(value) => update('medications', value)}
        placeholder="Medications"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />
    </Card>
  )
}

export default function CareScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [activeTab, setActiveTab] = useState<
    'Today' | 'Insights' | 'Calendar' | 'Reminders' | 'Settings'
  >('Today')
  const [data, setData] = useState<{
    logs: CareLog[]
    settings: CareSettings
    coupleId: string
    userId: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mood, setMood] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [sex, setSex] = useState<string[]>([])
  const [discharge, setDischarge] = useState<string[]>([])
  const [digestion, setDigestion] = useState<string[]>([])
  const [pregnancyTest, setPregnancyTest] = useState<string[]>([])
  const [ovulationTest, setOvulationTest] = useState('')
  const [contraceptives, setContraceptives] = useState<string[]>([])
  const [activities, setActivities] = useState<string[]>([])
  const [water, setWater] = useState('')
  const [weight, setWeight] = useState('')
  const [basalTemp, setBasalTemp] = useState('')
  const [notes, setNotes] = useState('')
  const [periodDay, setPeriodDay] = useState(false)
  const [shareCycle, setShareCycle] = useState(true)
  const [cycleLength, setCycleLength] = useState('28')
  const [periodLength, setPeriodLength] = useState('5')
  const [lastPeriodStart, setLastPeriodStart] = useState('')
  const [intimacyMessage, setIntimacyMessage] = useState('')
  const [intimacyResult, setIntimacyResult] = useState('')
  const [intimacyError, setIntimacyError] = useState('')
  const [intimacyLoading, setIntimacyLoading] = useState(false)
  const toggle = (current: string[], value: string, setter: (next: string[]) => void) =>
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value])
  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const next = await getCareData()
      setData(next)
      setCycleLength(String(next.settings.cycleLength))
      setPeriodLength(String(next.settings.periodLength))
      setLastPeriodStart(next.settings.lastPeriodStart ?? '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load Care data.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void refresh()
  }, [])
  const summary = useMemo(
    () =>
      data
        ? calculateNativeCycleSummary(
            data.logs.map((log) => ({
              log_date: log.logDate,
              period_day: log.periodDay,
              mood: log.mood,
              symptoms: log.symptoms,
            })),
            {
              cycle_length: data.settings.cycleLength,
              period_length: data.settings.periodLength,
              last_period_start: data.settings.lastPeriodStart,
            }
          )
        : null,
    [data]
  )
  const save = async (overrideDate?: string) => {
    if (!data) return
    try {
      setSaving(true)
      const checkIn = {
        mood: mood || undefined,
        symptoms: selectedSymptoms,
        sex,
        discharge,
        digestion,
        pregnancyTest,
        ovulationTest: ovulationTest || undefined,
        contraceptives,
        activities,
        waterIntake: water ? Number(water) : undefined,
        weight: weight ? Number(weight) : undefined,
        basalTemp: basalTemp ? Number(basalTemp) : undefined,
        notes: notes || undefined,
        periodStarted: overrideDate ? true : periodDay,
      }
      if (overrideDate) await saveCareLogForDate(data.coupleId, data.userId, overrideDate, checkIn)
      else await saveTodayCareLog(checkIn)
      Alert.alert('Saved', 'Your shared Care log was saved.')
      await refresh()
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }
  const saveSettings = async () => {
    if (!data) return
    try {
      await saveCareSettings({
        coupleId: data.coupleId,
        cycleLength: Number(cycleLength),
        periodLength: Number(periodLength),
        lastPeriodStart: lastPeriodStart || null,
      })
      await refresh()
      Alert.alert('Saved', 'Cycle settings updated.')
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  const exportData = async () => {
    if (!data) return
    const header = 'date,period,mood,symptoms,water,weight,basal_temperature,notes'
    const rows = data.logs.map((log) =>
      [
        log.logDate,
        log.periodDay,
        log.mood ?? '',
        `"${(log.symptoms ?? []).join('; ')}"`,
        log.waterIntake ?? '',
        log.weight ?? '',
        log.basalTemp ?? '',
        `"${(log.notes ?? '').replace(/"/g, '""')}"`,
      ].join(',')
    )
    await Share.share({ message: [header, ...rows].join('\n'), title: 'Care data export.csv' })
  }
  const askIntimacy = async () => {
    if (!intimacyMessage.trim() || intimacyLoading) return
    setIntimacyLoading(true)
    setIntimacyError('')
    setIntimacyResult('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '')
      if (!webUrl || !session?.access_token) throw new Error('Please sign in again.')
      const response = await fetch(`${webUrl}/api/ai/intimacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: intimacyMessage.trim() }),
      })
      const body = (await response.json()) as {
        response?: string
        consentDisclaimer?: string
        error?: string
      }
      if (!response.ok || !body.response) {
        throw new Error(body.error || 'AI advice is unavailable.')
      }
      setIntimacyResult(
        body.consentDisclaimer ? `${body.response}\n\n${body.consentDisclaimer}` : body.response
      )
    } catch (caught) {
      setIntimacyError(caught instanceof Error ? caught.message : 'AI advice is unavailable.')
    } finally {
      setIntimacyLoading(false)
    }
  }
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent1} />
        <Text style={styles.muted}>Loading Care...</Text>
      </View>
    )
  if (!data || !summary)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>{error ?? 'Connect to your partner to use Care.'}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Retry loading Care"
          accessibilityHint="Loads Care data again"
          style={styles.saveButton}
          onPress={() => void refresh()}
        >
          <Text style={styles.saveText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.intimacyContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.intimacyCard,
            { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.intimacyHeader}>
            <Sparkles color={colors.accent1} size={20} />
            <View style={styles.intimacyHeaderText}>
              <Text style={[styles.intimacyTitle, { color: colors.textPrimary }]}>
                Ask before discussing intimacy
              </Text>
              <Text style={[styles.intimacyDescription, { color: colors.textSecondary }]}>
                Share only what you choose for consent-led, non-graphic guidance.
              </Text>
            </View>
          </View>
          <TextInput
            value={intimacyMessage}
            onChangeText={setIntimacyMessage}
            maxLength={2000}
            multiline
            placeholder="What would help us talk about closeness or boundaries?"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.intimacyInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          />
          <View style={styles.intimacyActions}>
            <Text style={[styles.intimacyPrivacy, { color: colors.textSecondary }]}>
              Nothing is shared until you press Ask.
            </Text>
            <TouchableOpacity
              style={[styles.intimacyButton, { backgroundColor: colors.accent1 }]}
              onPress={() => void askIntimacy()}
              disabled={!intimacyMessage.trim() || intimacyLoading}
            >
              <Text style={[styles.intimacyButtonText, { color: colors.background }]}>
                {intimacyLoading ? 'Thinking…' : 'Ask intimacy guide'}
              </Text>
            </TouchableOpacity>
          </View>
          {intimacyError ? (
            <Text style={[styles.intimacyError, { color: colors.error }]}>{intimacyError}</Text>
          ) : null}
          {intimacyResult ? (
            <View
              style={[
                styles.intimacyResult,
                { backgroundColor: colors.surface, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.intimacyResultText, { color: colors.textPrimary }]}>
                {intimacyResult}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {(['Today', 'Insights', 'Calendar', 'Reminders', 'Settings'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {activeTab === 'Insights' ? (
        <Insights logs={data.logs} summary={summary} savedCycleLength={data.settings.cycleLength} />
      ) : activeTab === 'Calendar' ? (
        <Calendar
          logs={data.logs}
          summary={summary}
          onLog={(date) => {
            setActiveTab('Today')
            void save(date)
          }}
        />
      ) : activeTab === 'Reminders' ? (
        <Reminders />
      ) : activeTab === 'Settings' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>CYCLE CARE</Text>
          <Text style={styles.title}>Settings</Text>
          <Card title="Cycle settings">
            <TextInput
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="numeric"
              placeholder="Average cycle length (days)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={periodLength}
              onChangeText={setPeriodLength}
              keyboardType="numeric"
              placeholder="Average period length (days)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={lastPeriodStart}
              onChangeText={setLastPeriodStart}
              placeholder="Last period start (YYYY-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <TouchableOpacity style={styles.saveButton} onPress={() => void saveSettings()}>
              <Text style={styles.saveText}>Save cycle settings</Text>
            </TouchableOpacity>
          </Card>
          <Card title="Privacy">
            <Reminder
              label="Share cycle data with partner"
              value={shareCycle}
              onChange={() => setShareCycle((value) => !value)}
            />
          </Card>
          <Card title="Export">
            <TouchableOpacity style={styles.secondaryButton} onPress={() => void exportData()}>
              <Text style={styles.saveText}>Export cycle data (CSV)</Text>
            </TouchableOpacity>
          </Card>
          <HealthProfile />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>CYCLE CARE · SHARED WITH YOUR PARTNER</Text>
          <Text style={styles.title}>Today</Text>
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>CYCLE DAY</Text>
            <Text style={styles.days}>{summary.day ?? '—'}</Text>
            <Text style={styles.heroNote}>
              {summary.nextPeriodStart
                ? summary.nextPeriodStart === dateKey(new Date())
                  ? 'Period expected today'
                  : `Next period ${summary.nextPeriodStart}`
                : 'Log a period to begin forecasting.'}
            </Text>
          </View>
          <Card title="Mood">
            <Chips
              options={moods}
              selected={mood ? [mood] : []}
              onToggle={(value) => setMood(mood === value ? '' : value)}
              tone="purple"
            />
          </Card>
          <Card title="Symptoms">
            <Chips
              options={symptoms}
              selected={selectedSymptoms}
              onToggle={(value) => toggle(selectedSymptoms, value, setSelectedSymptoms)}
            />
          </Card>
          <Card title="Period day">
            <Reminder
              label="I am on my period today"
              value={periodDay}
              onChange={() => setPeriodDay((value) => !value)}
            />
          </Card>
          <Card title="Sexual activity">
            <Chips
              options={sexOptions}
              selected={sex}
              onToggle={(value) => toggle(sex, value, setSex)}
            />
          </Card>
          <Card title="Contraception">
            <Chips
              options={contraceptionOptions}
              selected={contraceptives}
              onToggle={(value) => toggle(contraceptives, value, setContraceptives)}
              tone="green"
            />
          </Card>
          <Card title="Discharge">
            <Chips
              options={dischargeOptions}
              selected={discharge}
              onToggle={(value) => toggle(discharge, value, setDischarge)}
              tone="purple"
            />
          </Card>
          <Card title="Digestion">
            <Chips
              options={digestionOptions}
              selected={digestion}
              onToggle={(value) => toggle(digestion, value, setDigestion)}
            />
          </Card>
          <Card title="Pregnancy test">
            <Chips
              options={pregnancyOptions}
              selected={pregnancyTest}
              onToggle={(value) => toggle(pregnancyTest, value, setPregnancyTest)}
            />
          </Card>
          <Card title="Activities">
            <Chips
              options={activityOptions}
              selected={activities}
              onToggle={(value) => toggle(activities, value, setActivities)}
              tone="green"
            />
          </Card>
          <Card title="Ovulation test">
            <Chips
              options={['Positive', 'Negative', "Didn't take"]}
              selected={ovulationTest ? [ovulationTest] : []}
              onToggle={(value) => setOvulationTest(ovulationTest === value ? '' : value)}
            />
          </Card>
          <Card title="Daily details">
            <TextInput
              value={water}
              onChangeText={setWater}
              keyboardType="numeric"
              placeholder="Water (ml)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="Weight (kg)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={basalTemp}
              onChangeText={setBasalTemp}
              keyboardType="decimal-pad"
              placeholder="Basal temperature (°C)"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Notes"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, styles.notes]}
            />
          </Card>
          <TouchableOpacity
            disabled={saving}
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={() => void save()}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.saveText}>Save shared daily log</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    intimacyContainer: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
    intimacyCard: { borderRadius: sizes.radius.card, borderWidth: 1, padding: 18, gap: 12 },
    intimacyHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    intimacyHeaderText: { flex: 1, gap: 4 },
    intimacyTitle: { fontSize: sizes.text.bodyLg, fontWeight: '800' },
    intimacyDescription: { fontSize: sizes.text.sm, lineHeight: 20 },
    intimacyInput: {
      minHeight: 96,
      borderRadius: sizes.radius.btn,
      borderWidth: 1,
      padding: 12,
      textAlignVertical: 'top',
    },
    intimacyActions: { gap: 10 },
    intimacyPrivacy: { fontSize: sizes.text.xs },
    intimacyButton: {
      alignSelf: 'flex-end',
      borderRadius: sizes.radius.pill,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    intimacyButtonText: { fontWeight: '800' },
    intimacyError: { fontSize: sizes.text.sm },
    intimacyResult: { borderRadius: sizes.radius.btn, borderWidth: 1, padding: 14 },
    intimacyResultText: { fontSize: sizes.text.sm, lineHeight: 22 },
    content: { padding: 20, paddingTop: 24, paddingBottom: 50 },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      gap: 12,
    },
    eyebrow: {
      color: colors.textSecondary,
      fontWeight: '700',
      letterSpacing: 1.3,
      fontSize: sizes.text.xs,
    },
    title: { color: colors.textPrimary, fontWeight: '800', fontSize: sizes.text.hLg, marginTop: 6 },
    tabRow: {
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 62,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    tab: {
      borderRadius: sizes.radius.btn,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    tabActive: { backgroundColor: colors.accent1 },
    tabText: { color: colors.background, fontWeight: '700', fontSize: sizes.text.xs },
    hero: {
      marginTop: 18,
      borderRadius: sizes.radius.panel,
      padding: 24,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    heroLabel: {
      color: colors.textSecondary,
      fontSize: sizes.text.xs,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    days: { color: colors.accent3, fontWeight: '800', fontSize: 38, marginTop: 8 },
    heroNote: {
      color: colors.textPrimary,
      fontSize: sizes.text.body,
      fontWeight: '600',
      marginTop: 10,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 18,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cardTitle: { color: colors.textPrimary, fontSize: sizes.text.hSm, fontWeight: '800' },
    muted: { color: colors.textSecondary, fontSize: sizes.text.sm, marginTop: 5 },
    text: { color: colors.textPrimary, fontSize: sizes.text.sm },
    accentText: { color: colors.accent1, fontWeight: '700' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    chip: {
      borderRadius: sizes.radius.card,
      paddingHorizontal: 13,
      paddingVertical: 9,
      backgroundColor: colors.surface,
    },
    purpleChip: { backgroundColor: colors.surface },
    greenChip: { backgroundColor: colors.accent2 },
    chipSelected: { backgroundColor: colors.accent1 },
    chipText: { color: colors.textPrimary, fontWeight: '600', fontSize: sizes.text.sm },
    chipTextSelected: { color: colors.background },
    input: {
      borderRadius: sizes.radius.input,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginTop: 10,
    },
    notes: { minHeight: 82, textAlignVertical: 'top' },
    saveButton: {
      marginTop: 16,
      alignItems: 'center',
      borderRadius: sizes.radius.btn,
      backgroundColor: colors.accent1,
      paddingVertical: 15,
    },
    secondaryButton: {
      alignItems: 'center',
      borderRadius: sizes.radius.btn,
      backgroundColor: colors.accent2,
      paddingVertical: 14,
      marginTop: 14,
    },
    saveText: { color: colors.background, fontWeight: '800' },
    disabled: { opacity: 0.6 },
    reminder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    stat: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.input,
      padding: 12,
    },
    statValue: { color: colors.accent1, fontSize: sizes.text.bodyLg, fontWeight: '800' },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
    barLabel: { color: colors.textPrimary, width: 105, fontSize: sizes.text.xs },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    bar: { height: '100%', backgroundColor: colors.accent1, borderRadius: 5 },
    barValue: { color: colors.textSecondary, width: 20, textAlign: 'right' },
    frequencyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    calendarMonth: { color: colors.textPrimary, fontWeight: '800' },
    nav: { color: colors.accent1, fontSize: sizes.text.dSm, paddingHorizontal: 12 },
    weekRow: { flexDirection: 'row', marginTop: 14 },
    weekDay: {
      color: colors.textSecondary,
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontWeight: '700',
    },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: sizes.radius.input,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dayText: { color: colors.textPrimary, fontSize: sizes.text.sm },
    periodDay: { backgroundColor: colors.accent1 },
    predictedDay: { borderColor: colors.accent2, borderStyle: 'dotted' },
    fertileDay: { backgroundColor: colors.accent2 },
    ovulationDay: { backgroundColor: colors.success },
    todayDay: { borderColor: colors.textPrimary, borderWidth: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
    legendText: { color: colors.textSecondary, fontSize: sizes.text.xs },
  })
