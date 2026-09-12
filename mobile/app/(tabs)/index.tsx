import { useRouter } from 'expo-router'
import {
  Clock3,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  RefreshCw,
  Smile,
  Play,
  Pause,
  CalendarDays,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { getCareData, type CareLog, type CareSettings } from '@/services/care'
import { calculateNativeCycleSummary } from '@/services/cycleCalculator'
import { getDashboardData, type DashboardData } from '@/services/dashboard'
import { calculateDaysTogether, relationshipAnniversary } from '@/services/relationshipDays'

type CareData = { logs: CareLog[]; settings: CareSettings }

const quickActions = [
  { label: 'Love Note', icon: Heart, route: '/chat' },
  { label: 'Log Mood', icon: Smile, route: '/care' },
  { label: 'Add Memory', icon: ImageIcon, route: '/memories' },
  { label: 'Start Timer', icon: Clock3, route: '/wellness' },
  { label: 'Calendar', icon: CalendarDays, route: '/plans' },
  { label: 'Open Chat', icon: MessageCircle, route: '/chat' },
] as const

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function daysUntil(value: string) {
  return Math.max(
    0,
    Math.ceil(
      (dateOnly(new Date(`${value}T12:00:00`)).getTime() - dateOnly(new Date()).getTime()) /
        86400000
    )
  )
}

function nextAnniversary() {
  const today = new Date()
  const year =
    today.getFullYear() + (today >= new Date(`${today.getFullYear()}-02-02T12:00:00`) ? 1 : 0)
  return `${year}-02-02`
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [care, setCare] = useState<CareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [nextDashboard, nextCare] = await Promise.all([getDashboardData(), getCareData()])
      setDashboard(nextDashboard)
      setCare({ logs: nextCare.logs, settings: nextCare.settings })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(
    () =>
      care
        ? calculateNativeCycleSummary(
            care.logs.map((log) => ({
              log_date: log.logDate,
              period_day: log.periodDay,
              mood: log.mood,
              symptoms: log.symptoms,
            })),
            {
              cycle_length: care.settings.cycleLength,
              period_length: care.settings.periodLength,
              last_period_start: care.settings.lastPeriodStart,
            }
          )
        : null,
    [care]
  )
  const anniversary = nextAnniversary()
  const anniversaryDays = daysUntil(anniversary)
  const countdown =
    summary?.nextPeriodStart && daysUntil(summary.nextPeriodStart) < anniversaryDays
      ? `${daysUntil(summary.nextPeriodStart)} days until next period`
      : `${anniversaryDays} days until Anniversary`
  const yearsTogether = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(`${relationshipAnniversary}T12:00:00`).getTime()) / 31536000000
    )
  )

  if (loading)
    return (
      <View style={styles.center}>
        <RefreshCw color="#d9bfd7" size={24} />
        <Text style={styles.muted}>Loading your little world...</Text>
      </View>
    )
  if (!dashboard || !care || !summary)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Dashboard data is unavailable.'}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Retry loading dashboard"
          accessibilityHint="Loads the dashboard data again"
          style={styles.primaryButton}
          onPress={() => void load()}
        >
          <Text style={styles.primaryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Love dashboard</Text>
      <Text style={styles.title}>Good evening, KoKo × Pu Tuu</Text>
      <Text style={styles.subtitle}>Today is a good day to notice the little things.</Text>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>DAYS TOGETHER</Text>
        <Text style={styles.heroValue}>{calculateDaysTogether()}</Text>
        <Text style={styles.heroText}>days of choosing each other</Text>
      </View>
      <Text style={styles.sectionTitle}>Relationship stats</Text>
      <View style={styles.stats}>
        <StatCard title="Messages" value={dashboard.messageCount} />
        <StatCard title="Memories" value={dashboard.memoryCount} />
        <StatCard title="Vault" value={dashboard.vaultCount} />
        <StatCard title="Longest streak" value={dashboard.longestStreak} />
      </View>
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.actions}>
        {quickActions.map(({ label, icon: Icon, route }) => (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={`Opens ${label}`}
            style={styles.action}
            onPress={() => router.push(route)}
          >
            <Icon color="#ff9bba" size={22} />
            <Text style={styles.actionText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Countdown</Text>
        <Text style={styles.countdown}>{countdown}</Text>
        <Text style={styles.muted}>Your next meaningful date, gently held.</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Memory of the day</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Refresh memory of the day"
            onPress={() => void load()}
          >
            <RefreshCw color="#d9bfd7" size={18} />
          </TouchableOpacity>
        </View>
        {dashboard.memory?.image_url ? (
          <Image source={{ uri: dashboard.memory.image_url }} style={styles.memoryImage} />
        ) : null}
        <Text style={styles.memoryTitle}>
          {dashboard.memory?.title ?? 'A new memory is waiting'}
        </Text>
        <Text style={styles.muted}>
          {dashboard.memory?.caption ?? 'Add a memory to make this space yours.'}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mini Care check</Text>
        <Text style={styles.careValue}>
          {summary.day ? `Cycle day ${summary.day}` : 'No cycle day yet'}
        </Text>
        <Text style={styles.muted}>
          {summary.nextPeriodStart
            ? `Next period in ${daysUntil(summary.nextPeriodStart)} days`
            : 'Log a period to begin forecasting.'}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open Care"
          style={styles.secondaryButton}
          onPress={() => router.push('/care')}
        >
          <Text style={styles.secondaryText}>Open Care</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Our playlist</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open Music"
            onPress={() => router.push('/music')}
          >
            <Text style={styles.link}>Open Music</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.musicTitle}>
          {dashboard.playlistSong?.title ?? 'Add your first shared song'}
        </Text>
        <Text style={styles.muted}>
          {dashboard.playlistSong?.artist ?? 'A soundtrack for your little world.'}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause playlist' : 'Play playlist'}
          style={styles.playButton}
          onPress={() => {
            setPlaying((value) => !value)
            if (dashboard.playlistSong?.external_id)
              void Linking.openURL(
                `https://www.youtube.com/watch?v=${dashboard.playlistSong.external_id}`
              )
          }}
        >
          {playing ? <Pause color="#fff" size={18} /> : <Play color="#fff" size={18} />}
          <Text style={styles.primaryText}>{playing ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.shareCard}>
        <Text style={styles.cardTitle}>Anniversary</Text>
        <Text style={styles.anniversary}>{yearsTogether} years together</Text>
        <Text style={styles.muted}>
          Every February 2 · {anniversaryDays} days until the next one
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Share our love"
          accessibilityHint="Opens the device sharing options"
          style={styles.secondaryButton}
          onPress={() =>
            void Share.share({
              message: `Celebrating ${yearsTogether} years together on February 2.`,
            })
          }
        >
          <Text style={styles.secondaryText}>Share our love</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 48,
    backgroundColor: '#0f0f12',
    gap: 14,
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f12',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },
  eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#c4c4ce', fontSize: 15, lineHeight: 22 },
  heroCard: {
    backgroundColor: '#2d1b4e',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#ff9bba66',
    alignItems: 'center',
  },
  heroLabel: { color: '#d9bfd7', fontSize: 11, letterSpacing: 1.6 },
  heroValue: { color: '#ffd7a8', fontSize: 42, fontWeight: '800', marginTop: 6 },
  heroText: { color: '#f3f0f5', fontSize: 15 },
  sectionTitle: { color: '#f3f0f5', fontSize: 18, fontWeight: '800', marginTop: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    backgroundColor: '#171b22',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  statTitle: { color: '#c4c4ce', fontSize: 12, textTransform: 'uppercase' },
  statValue: { color: '#ff9bba', fontSize: 26, fontWeight: '800', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: {
    width: '31%',
    minHeight: 74,
    backgroundColor: '#171b22',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 8,
  },
  actionText: { color: '#f3f0f5', fontSize: 11, textAlign: 'center', fontWeight: '700' },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  shareCard: {
    backgroundColor: '#3a1d35',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ff9bba66',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#f3f0f5', fontSize: 17, fontWeight: '800' },
  countdown: { color: '#ffd7a8', fontSize: 25, fontWeight: '800', marginTop: 12 },
  memoryImage: { width: '100%', height: 170, borderRadius: 14, marginTop: 12 },
  memoryTitle: { color: '#f3f0f5', fontSize: 18, fontWeight: '700', marginTop: 12 },
  careValue: { color: '#8ed0c4', fontSize: 24, fontWeight: '800', marginTop: 10 },
  musicTitle: { color: '#f3f0f5', fontSize: 18, fontWeight: '700', marginTop: 12 },
  anniversary: { color: '#ffd7a8', fontSize: 25, fontWeight: '800', marginTop: 10 },
  muted: { color: '#c4c4ce', fontSize: 13, marginTop: 6 },
  error: { color: '#ff9b9b', textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#ff6b81',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#604582',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 11,
    marginTop: 14,
  },
  secondaryText: { color: '#fff', fontWeight: '800' },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b81',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 14,
  },
  link: { color: '#ff9bba', fontWeight: '700' },
})
