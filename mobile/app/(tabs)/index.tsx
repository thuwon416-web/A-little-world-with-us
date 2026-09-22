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
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import OnThisDay from '@/components/dashboard/OnThisDay'
import OurStats from '@/components/dashboard/OurStats'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'
import { getCareData, type CareLog, type CareSettings } from '@/services/care'
import { calculateNativeCycleSummary } from '@/services/cycleCalculator'
import { getDashboardData, type DashboardData } from '@/services/dashboard'
import { calculateDaysTogether, relationshipAnniversary } from '@/services/relationshipDays'
import {
  DEFAULT_DASHBOARD_WIDGETS,
  loadDashboardLayout,
  saveDashboardLayout,
  type DashboardLayout,
  type DashboardWidgetId,
} from '@/services/settings'

type CareData = { logs: CareLog[]; settings: CareSettings }

const FOCUS_ITEMS = [
  'Slow down and enjoy the quiet rhythm of us.',
  'Make space for a little softness and calm today.',
  'Choose gentleness, even in the smallest moments.',
  'Be extra present with each other today.',
  'Hold each other with patience and warmth.',
]

const RITUAL_ITEMS = [
  'Share one thing that made your heart feel full today.',
  'Hold hands for a minute without talking.',
  'Send a warm voice note or sweet message.',
  'Take a slow walk and notice one beautiful thing together.',
  'Make tea or coffee and sit in the same quiet moment.',
]

function getDailyFocus(): string {
  return FOCUS_ITEMS[new Date().getDate() % FOCUS_ITEMS.length]
}

function getLittleRitual(): string {
  return RITUAL_ITEMS[new Date().getDate() % RITUAL_ITEMS.length]
}

const quickActions = [
  { label: 'Love Note', icon: Heart, route: '/chat' },
  { label: 'Log Mood', icon: Smile, route: '/care' },
  { label: 'Add Memory', icon: ImageIcon, route: '/memories' },
  { label: 'Start Timer', icon: Clock3, route: '/wellness' },
  { label: 'Calendar', icon: CalendarDays, route: '/plans' },
  { label: 'Open Chat', icon: MessageCircle, route: '/chat' },
] as const

const widgetLabels: Record<DashboardWidgetId, string> = {
  'days-counter': 'Days Together',
  countdown: 'Countdown',
  'memory-of-the-day': 'Memory of the Day',
  'mini-care-check': 'Mini Care Check',
  'music-player': 'Music Player',
}

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function daysUntil(value: string) {
  return Math.ceil(
    (dateOnly(new Date(`${value}T12:00:00`)).getTime() - dateOnly(new Date()).getTime()) /
      86400000
  )
}

function nextAnniversary() {
  const today = new Date()
  const year =
    today.getFullYear() + (today >= new Date(`${today.getFullYear()}-02-02T12:00:00`) ? 1 : 0)
  return `${year}-02-02`
}

function StatCard({ title, value }: { title: string; value: number }) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [care, setCare] = useState<CareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>({
    order: [...DEFAULT_DASHBOARD_WIDGETS],
    visibility: Object.fromEntries(
      DEFAULT_DASHBOARD_WIDGETS.map((id) => [id, true])
    ) as Record<DashboardWidgetId, boolean>,
  })
  const [customizing, setCustomizing] = useState(false)
  const [layoutError, setLayoutError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [nextDashboard, nextCare] = await Promise.all([getDashboardData(), getCareData()])
      setDashboard(nextDashboard)
      setCare({ logs: nextCare.logs, settings: nextCare.settings })
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: link } = await supabase
          .from('couple_links')
          .select('couple_id')
          .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
          .eq('status', 'accepted')
          .maybeSingle()
        setCoupleId(link?.couple_id ?? null)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    void loadDashboardLayout()
      .then(setDashboardLayout)
      .catch((caught) => setLayoutError(caught instanceof Error ? caught.message : 'Unable to load dashboard layout.'))
  }, [])

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
  const nextPeriodDays = summary?.nextPeriodStart ? daysUntil(summary.nextPeriodStart) : null
  const nextPeriodText =
    nextPeriodDays === null
      ? null
      : nextPeriodDays === 0
        ? 'Period expected today'
        : nextPeriodDays < 0
          ? `Period overdue by ${Math.abs(nextPeriodDays)} days`
          : `Next period in ${nextPeriodDays} days`
  const countdown =
    nextPeriodText && nextPeriodDays !== null && nextPeriodDays < anniversaryDays
      ? nextPeriodText
      : `${anniversaryDays} days until Anniversary`
  const yearsTogether = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(`${relationshipAnniversary}T12:00:00`).getTime()) / 31536000000
    )
  )
  const todaysFocus = getDailyFocus()
  const littleRitual = getLittleRitual()
  const updateLayout = (next: DashboardLayout) => {
    setDashboardLayout(next)
    void saveDashboardLayout(next).catch((caught) =>
      setLayoutError(caught instanceof Error ? caught.message : 'Unable to save dashboard layout.')
    )
  }
  const moveWidget = (id: DashboardWidgetId, direction: -1 | 1) => {
    const index = dashboardLayout.order.indexOf(id)
    const target = index + direction
    if (target < 0 || target >= dashboardLayout.order.length) return
    const order = [...dashboardLayout.order]
    ;[order[index], order[target]] = [order[target], order[index]]
    updateLayout({ ...dashboardLayout, order })
  }
  const renderWidget = (id: DashboardWidgetId) => {
    if (id === 'days-counter') {
      return (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>DAYS TOGETHER</Text>
          <Text style={styles.heroValue}>{calculateDaysTogether()}</Text>
          <Text style={styles.heroText}>days of choosing each other</Text>
        </View>
      )
    }
    if (id === 'countdown') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Countdown</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={styles.muted}>Your next meaningful date, gently held.</Text>
        </View>
      )
    }
    if (id === 'memory-of-the-day') {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Memory of the day</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh memory of the day" onPress={() => void load()}>
              <RefreshCw color={colors.accent2} size={18} />
            </TouchableOpacity>
          </View>
          {dashboard?.memory?.image_url ? <Image source={{ uri: dashboard.memory.image_url }} style={styles.memoryImage} /> : null}
          <Text style={styles.memoryTitle}>{dashboard?.memory?.title ?? 'A new memory is waiting'}</Text>
          <Text style={styles.muted}>{dashboard?.memory?.caption ?? 'Add a memory to make this space yours.'}</Text>
        </View>
      )
    }
    if (id === 'mini-care-check') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mini Care check</Text>
          <Text style={styles.careValue}>{summary?.day ? `Cycle day ${summary.day}` : 'No cycle day yet'}</Text>
          <Text style={styles.muted}>{nextPeriodText ?? 'Log a period to begin forecasting.'}</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Care" style={styles.secondaryButton} onPress={() => router.push('/care')}>
            <Text style={styles.secondaryText}>Open Care</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Our playlist</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Music" onPress={() => router.push('/music')}>
            <Text style={styles.link}>Open Music</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.musicTitle}>{dashboard?.playlistSong?.title ?? 'Add your first shared song'}</Text>
        <Text style={styles.muted}>{dashboard?.playlistSong?.artist ?? 'A soundtrack for your little world.'}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={playing ? 'Pause playlist' : 'Play playlist'} style={styles.playButton} onPress={() => {
          setPlaying((value) => !value)
          if (dashboard?.playlistSong?.external_id) void Linking.openURL(`https://www.youtube.com/watch?v=${dashboard.playlistSong.external_id}`)
        }}>
          {playing ? <Pause color={colors.background} size={18} /> : <Play color={colors.background} size={18} />}
          <Text style={styles.primaryText}>{playing ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading)
    return (
      <View style={styles.center}>
        <RefreshCw color={colors.accent2} size={24} />
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
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.eyebrow}>Love dashboard</Text>
      <Text style={styles.title}>Good evening, KoKo × Pu Tuu</Text>
      <Text style={styles.subtitle}>Today is a good day to notice the little things.</Text>
      <TouchableOpacity style={[styles.customizeButton, { backgroundColor: colors.cardBg }]} onPress={() => setCustomizing(true)}>
        <Settings2 color={colors.accent1} size={18} />
        <Text style={[styles.customizeText, { color: colors.textPrimary }]}>Customize home</Text>
      </TouchableOpacity>
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>TODAY&apos;S FOCUS</Text>
        <Text style={[styles.infoText, { color: colors.textPrimary }]}>{todaysFocus}</Text>
      </View>
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>LITTLE RITUAL</Text>
        <Text style={[styles.infoText, { color: colors.textPrimary }]}>{littleRitual}</Text>
      </View>
      {dashboardLayout.order
        .filter((id) => dashboardLayout.visibility[id])
        .map((id) => <View key={id}>{renderWidget(id)}</View>)}
      {coupleId ? <OnThisDay coupleId={coupleId} /> : null}
      <Text style={styles.sectionTitle}>Relationship stats</Text>
      <View style={styles.stats}>
        <StatCard title="Messages" value={dashboard.messageCount} />
        <StatCard title="Memories" value={dashboard.memoryCount} />
        <StatCard title="Vault" value={dashboard.vaultCount} />
        <StatCard title="Longest streak" value={dashboard.longestStreak} />
      </View>
      {coupleId ? <OurStats coupleId={coupleId} /> : null}
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
            <Icon color={colors.accent1} size={22} />
            <Text style={styles.actionText}>{label}</Text>
          </TouchableOpacity>
        ))}
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
      <Modal visible={customizing} transparent animationType="slide" onRequestClose={() => setCustomizing(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.customizeModal, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Customize home</Text>
              <TouchableOpacity onPress={() => setCustomizing(false)} accessibilityLabel="Close customization">
                <X color={colors.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            {dashboardLayout.order.map((id, index) => (
              <View key={id} style={[styles.widgetRow, { borderColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={[styles.visibilityToggle, { backgroundColor: dashboardLayout.visibility[id] ? colors.accent1 : colors.surface }]}
                  onPress={() => updateLayout({ ...dashboardLayout, visibility: { ...dashboardLayout.visibility, [id]: !dashboardLayout.visibility[id] } })}
                >
                  <Text style={{ color: dashboardLayout.visibility[id] ? colors.background : colors.textSecondary }}>
                    {dashboardLayout.visibility[id] ? 'Shown' : 'Hidden'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.widgetLabel, { color: colors.textPrimary }]}>{widgetLabels[id]}</Text>
                <TouchableOpacity onPress={() => moveWidget(id, -1)} disabled={index === 0} accessibilityLabel={`Move ${widgetLabels[id]} up`}>
                  <ChevronUp color={index === 0 ? colors.textSecondary : colors.textPrimary} size={20} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveWidget(id, 1)} disabled={index === dashboardLayout.order.length - 1} accessibilityLabel={`Move ${widgetLabels[id]} down`}>
                  <ChevronDown color={index === dashboardLayout.order.length - 1 ? colors.textSecondary : colors.textPrimary} size={20} />
                </TouchableOpacity>
              </View>
            ))}
            {layoutError ? <Text style={[styles.error, { color: colors.error }]}>{layoutError}</Text> : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 48,
    backgroundColor: colors.background,
    gap: 16,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  eyebrow: { color: colors.accent2, fontSize: sizes.text.xs, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.textPrimary, fontSize: sizes.text.hLg, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: sizes.text.body, lineHeight: 22 },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.panel,
    padding: 24,
    borderWidth: 1,
    borderColor: `${colors.accent1}66`,
    alignItems: 'center',
  },
  heroLabel: { color: colors.accent2, fontSize: sizes.text.xs, letterSpacing: 1.6 },
  heroValue: { color: colors.accent3, fontSize: 42, fontWeight: '800', marginTop: 6 },
  heroText: { color: colors.textPrimary, fontSize: sizes.text.body },
  infoCard: {
    borderWidth: 1,
    borderRadius: sizes.radius.btn,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  infoLabel: { fontSize: sizes.text.xs, fontWeight: '700', letterSpacing: 1.5 },
  infoText: { fontSize: sizes.text.sm, lineHeight: 21 },
  sectionTitle: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '800', marginTop: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.btn,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statTitle: { color: colors.textSecondary, fontSize: sizes.text.xs, textTransform: 'uppercase' },
  statValue: { color: colors.accent1, fontSize: sizes.text.hMd, fontWeight: '800', marginTop: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: {
    width: '31%',
    minHeight: 74,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
  },
  actionText: { color: colors.textPrimary, fontSize: sizes.text.xs, textAlign: 'center', fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  shareCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.accent1}66`,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '800' },
  countdown: { color: colors.accent3, fontSize: sizes.text.hMd, fontWeight: '800', marginTop: 12 },
  memoryImage: { width: '100%', height: 170, borderRadius: sizes.radius.btn, marginTop: 12 },
  memoryTitle: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '700', marginTop: 12 },
  careValue: { color: colors.success, fontSize: sizes.text.hMd, fontWeight: '800', marginTop: 10 },
  musicTitle: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '700', marginTop: 12 },
  anniversary: { color: colors.accent3, fontSize: sizes.text.hMd, fontWeight: '800', marginTop: 10 },
  muted: { color: colors.textSecondary, fontSize: sizes.text.sm, marginTop: 6 },
  error: { color: colors.error, textAlign: 'center' },
  primaryButton: {
    backgroundColor: colors.accent1,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: sizes.radius.input,
  },
  primaryText: { color: colors.background, fontWeight: '800' },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: sizes.radius.input,
    marginTop: 14,
  },
  secondaryText: { color: colors.background, fontWeight: '800' },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent1,
    borderRadius: sizes.radius.input,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 14,
  },
  link: { color: colors.accent1, fontWeight: '700' },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: sizes.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  customizeText: { fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000088',
  },
  customizeModal: {
    borderTopLeftRadius: sizes.radius.panel,
    borderTopRightRadius: sizes.radius.panel,
    padding: 20,
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: sizes.text.hMd, fontWeight: '800' },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  visibilityToggle: { borderRadius: sizes.radius.pill, paddingHorizontal: 10, paddingVertical: 7 },
  widgetLabel: { flex: 1, fontWeight: '700' },
})
