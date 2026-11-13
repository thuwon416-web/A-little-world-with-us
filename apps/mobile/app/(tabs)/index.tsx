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
  Flame,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { checkInStreak } from '@/services/advanced'
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
import { ConnectedCoupleAvatars } from '@/components/ConnectedCoupleAvatars'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from '@/i18n/useTranslation'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'
import { getCareData, type CareLog, type CareSettings } from '@/services/care'
import { calculateNativeCycleSummary } from '@/services/cycleCalculator'
import { getDashboardData, type DashboardData } from '@/services/dashboard'
import { calculateDaysTogether } from '@/services/relationshipDays'
import {
  DEFAULT_DASHBOARD_WIDGETS,
  loadDashboardLayout,
  saveDashboardLayout,
  type DashboardLayout,
  type DashboardWidgetId,
} from '@/services/settings'

type CareData = { logs: CareLog[]; settings: CareSettings }

function getDailyFocus(t: (key: string) => string): string {
  const key = ['one', 'two', 'three', 'four', 'five'][new Date().getDate() % 5]
  return t(`dashboard.focusItems.${key}`)
}

function getLittleRitual(t: (key: string) => string): string {
  const key = ['one', 'two', 'three', 'four', 'five'][new Date().getDate() % 5]
  return t(`dashboard.ritualItems.${key}`)
}

const quickActions = [
  { key: 'loveNote', icon: Heart, route: '/chat' },
  { key: 'logMood', icon: Smile, route: '/care' },
  { key: 'addMemory', icon: ImageIcon, route: '/memories' },
  { key: 'startTimer', icon: Clock3, route: '/wellness' },
  { key: 'calendar', icon: CalendarDays, route: '/plans' },
  { key: 'openChat', icon: MessageCircle, route: '/chat' },
] as const

const widgetLabels: Record<DashboardWidgetId, string> = {
  'days-counter': 'dashboard.widgets.daysTogether',
  countdown: 'dashboard.widgets.countdown',
  'memory-of-the-day': 'dashboard.widgets.memoryOfDay',
  'mini-care-check': 'dashboard.widgets.miniCare',
  'music-player': 'dashboard.widgets.musicPlayer',
}

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function daysUntil(value: string | null) {
  if (!value) return null
  return Math.ceil(
    (dateOnly(new Date(`${value}T12:00:00`)).getTime() - dateOnly(new Date()).getTime()) / 86400000
  )
}

function nextAnniversary(value: string | null) {
  if (!value) return null
  const today = new Date()
  const source = new Date(`${value}T12:00:00`)
  const next = new Date(today.getFullYear(), source.getMonth(), source.getDate(), 12)
  if (next < dateOnly(today)) next.setFullYear(today.getFullYear() + 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
}

function StatCard({ title, value }: { readonly title: string; readonly value: number }) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

// -- Days Together Banner --------------------------------------------------
// Pass the couple's start date ISO string; renders a romantic day counter.
// No network calls needed -- pure date math.
function DaysTogetherBanner({ startDateISO }: { startDateISO: string | null }) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  if (!startDateISO) return null;
  const start = new Date(startDateISO);
  if (isNaN(start.getTime())) return null;
  const diffMs = Date.now() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return (
    <View style={[daysBannerSt.container, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <Text style={[daysBannerSt.days, { color: colors.accent1 }]}>{days}</Text>
      <Text style={[daysBannerSt.label, { color: colors.textSecondary }]}>{t('dashboard.daysTogether')}</Text>
    </View>
  );
}
const daysBannerSt = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  days:  { fontSize: 36, fontWeight: '800' },
  label: { fontSize: 13, marginTop: 2, fontWeight: '500' },
});


export default function DashboardScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [care, setCare] = useState<CareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>({
    order: [...DEFAULT_DASHBOARD_WIDGETS],
    visibility: Object.fromEntries(DEFAULT_DASHBOARD_WIDGETS.map((id) => [id, true])) as Record<
      DashboardWidgetId,
      boolean
    >,
  })
  const [customizing, setCustomizing] = useState(false)
  const [layoutError, setLayoutError] = useState('')
  const [streak, setStreak] = useState<number>(0)
  const [streakCheckedInToday, setStreakCheckedInToday] = useState(false)
  const [streakCheckingIn, setStreakCheckingIn] = useState(false)

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
        const { data: myProf } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', user.id).maybeSingle()
        if (myProf) setUserProfile(myProf)

        const { data: link } = await supabase
          .from('couple_links')
          .select('couple_id, inviter_id, accepted_by')
          .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
          .eq('status', 'accepted')
          .maybeSingle()
        setCoupleId(link?.couple_id ?? null)
        if (link?.couple_id) {
          const { data: streakRow } = await supabase
            .from('love_streaks')
            .select('current_streak, last_check_in')
            .eq('couple_id', link.couple_id)
            .maybeSingle()
          if (streakRow) {
            setStreak(streakRow.current_streak ?? 0)
            const todayKey = new Date().toISOString().slice(0, 10)
            const lastKey = streakRow.last_check_in
              ? new Date(streakRow.last_check_in).toISOString().slice(0, 10)
              : null
            setStreakCheckedInToday(lastKey === todayKey)
          }
        }
        if (link) {
          const pId = link.inviter_id === user.id ? link.accepted_by : link.inviter_id
          if (pId) {
            const { data: pProf } = await supabase.from('profiles').select('full_name,avatar_url').eq('id', pId).maybeSingle()
            if (pProf) setPartnerProfile(pProf)
          }
        }
      }
    } catch (error_) {
      setError(t('dashboard.unavailable'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const handleStreakCheckIn = async () => {
    if (!coupleId || streakCheckingIn || streakCheckedInToday) return
    setStreakCheckingIn(true)
    try {
      const updated = await checkInStreak(coupleId)
      setStreak(updated?.current_streak ?? streak + 1)
      setStreakCheckedInToday(true)
    } catch (err) {
      console.warn('Streak checkin error:', err)
    } finally {
      setStreakCheckingIn(false)
    }
  }
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    void loadDashboardLayout()
      .then(setDashboardLayout)
      .catch((error_) =>
        setLayoutError(
          error_ instanceof Error ? error_.message : 'Unable to load dashboard layout.'
        )
      )
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
  const anniversary = nextAnniversary(dashboard?.anniversary ?? null)
  const anniversaryDays = daysUntil(anniversary)
  const nextPeriodDays = summary?.nextPeriodStart ? daysUntil(summary.nextPeriodStart) : null
  const nextPeriodText =
    nextPeriodDays === null
      ? null
      : nextPeriodDays === 0
        ? t('dashboard.periodExpectedToday')
        : nextPeriodDays < 0
          ? t('dashboard.periodOverdue').replace('{count}', String(Math.abs(nextPeriodDays)))
          : t('dashboard.nextPeriodIn').replace('{count}', String(nextPeriodDays))
  const countdown =
    nextPeriodText && nextPeriodDays !== null && anniversaryDays !== null && nextPeriodDays < anniversaryDays
      ? nextPeriodText
      : anniversaryDays !== null
        ? `${anniversaryDays} ${t('dashboard.untilAnniversary')}`
        : t('dashboard.addAnniversary')
  const yearsTogether = dashboard?.anniversary
    ? Math.max(0, new Date().getFullYear() - new Date(`${dashboard.anniversary}T12:00:00`).getFullYear())
    : 0
  const todaysFocus = getDailyFocus(t)
  const littleRitual = getLittleRitual(t)
  const updateLayout = (next: DashboardLayout) => {
    setDashboardLayout(next)
    void saveDashboardLayout(next).catch((error_) =>
      setLayoutError(t('dashboard.layoutSaveFailed'))
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
          <Text style={styles.heroLabel}>{t('dashboard.widgets.daysTogether').toUpperCase()}</Text>
          <Text style={styles.heroValue}>{calculateDaysTogether()}</Text>
          <Text style={styles.heroText}>{t('dashboard.daysOfChoosing')}</Text>
        </View>
      )
    }
    if (id === 'countdown') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.widgets.countdown')}</Text>
          <Text style={styles.countdown}>{countdown}</Text>
          <Text style={styles.muted}>{t('dashboard.subtitle')}</Text>
        </View>
      )
    }
    if (id === 'memory-of-the-day') {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('dashboard.widgets.memoryOfDay')}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.memoryRefresh')}
              onPress={() => void load()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RefreshCw color={colors.accent2} size={18} />
            </TouchableOpacity>
          </View>
          {dashboard?.memory?.image_url ? (
            <Image source={{ uri: dashboard.memory.image_url }} style={styles.memoryImage} />
          ) : null}
          <Text style={styles.memoryTitle}>
            {dashboard?.memory?.title ?? t('dashboard.newMemory')}
          </Text>
          <Text style={styles.muted}>
            {dashboard?.memory?.caption ?? t('dashboard.addMemory')}
          </Text>
        </View>
      )
    }
    if (id === 'mini-care-check') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('dashboard.miniCare')}</Text>
          <Text style={styles.careValue}>
            {summary?.day ? `${t('dashboard.cycleDay')} ${summary.day}` : t('dashboard.noCycleDay')}
          </Text>
          <Text style={styles.muted}>{nextPeriodText ?? t('dashboard.logPeriod')}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.openCare')}
            style={styles.secondaryButton}
            onPress={() => router.push('/care')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.secondaryText}>{t('dashboard.openCare')}</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t('dashboard.playlist')}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.openMusic')}
            onPress={() => router.push('/music')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.link}>{t('dashboard.openMusic')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.musicTitle}>
          {dashboard?.playlistSong?.title ?? t('dashboard.addSong')}
        </Text>
        <Text style={styles.muted}>
          {dashboard?.playlistSong?.artist ?? t('dashboard.soundtrack')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={playing ? t('dashboard.pause') : t('dashboard.play')}
          style={styles.playButton}
          onPress={() => {
            setPlaying((value) => !value)
            if (dashboard?.playlistSong?.external_id)
              void Linking.openURL(
                `https://www.youtube.com/watch?v=${dashboard.playlistSong.external_id}`
              )
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {playing ? (
            <Pause color={colors.accentForeground} size={18} />
          ) : (
            <Play color={colors.accentForeground} size={18} />
          )}
          <Text style={styles.primaryText}>{playing ? t('dashboard.pause') : t('dashboard.play')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading)
    return (
      <View style={styles.center}>
        <RefreshCw color={colors.accent2} size={24} />
        <Text style={styles.muted}>{t('dashboard.loading')}</Text>
      </View>
    )
  if (!dashboard || !care || !summary)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? t('dashboard.unavailable')}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.retry')}
          accessibilityHint="Loads the dashboard data again"
          style={styles.primaryButton}
          onPress={() => void load()}
        >
          <Text style={styles.primaryText}>{t('dashboard.retry')}</Text>
        </TouchableOpacity>
      </View>
    )

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.heroRow}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.eyebrow}>{t('dashboard.loveDashboard')}</Text>
          <Text style={styles.title}>{dashboard.coupleName}</Text>
          <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>
        </View>
        <ConnectedCoupleAvatars
          size="lg"
          userAvatarUrl={userProfile?.avatar_url}
          partnerAvatarUrl={partnerProfile?.avatar_url}
          userName={userProfile?.full_name}
          partnerName={partnerProfile?.full_name}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.streakBadge,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
        onPress={() => void handleStreakCheckIn()}
        disabled={streakCheckingIn || streakCheckedInToday}
        activeOpacity={0.8}
      >
        <View style={styles.streakLeft}>
          <Flame color={colors.accent1} size={18} />
          <Text style={[styles.streakCount, { color: colors.textPrimary }]}>
            {streak} {streak === 1 ? t('dashboard.streakDay') : t('dashboard.streakDays')}
          </Text>
        </View>
        <Text style={[styles.streakAction, { color: colors.accent1 }]}>
          {streakCheckedInToday
            ? `${t('dashboard.checkedInToday')} ❤️`
            : streakCheckingIn
              ? t('dashboard.checkingIn')
              : `${t('dashboard.tapToCheckIn')} ❤️`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.customizeButton, { backgroundColor: colors.cardBg }]}
        onPress={() => setCustomizing(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Settings2 color={colors.accent1} size={18} />
        <Text style={[styles.customizeText, { color: colors.textPrimary }]}>{t('dashboard.customizeHome')}</Text>
      </TouchableOpacity>
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('dashboard.focus').toUpperCase()}</Text>
        <Text style={[styles.infoText, { color: colors.textPrimary }]}>{todaysFocus}</Text>
      </View>
      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        ]}
      >
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('dashboard.ritual').toUpperCase()}</Text>
        <Text style={[styles.infoText, { color: colors.textPrimary }]}>{littleRitual}</Text>
      </View>
      {dashboardLayout.order
        .filter((id) => dashboardLayout.visibility[id])
        .map((id) => (
          <View key={id}>{renderWidget(id)}</View>
        ))}
      {coupleId ? <OnThisDay coupleId={coupleId} /> : null}
      <Text style={styles.sectionTitle}>{t('dashboard.relationshipStats')}</Text>
      <View style={styles.stats}>
        <StatCard title={t('dashboard.stats.messages')} value={dashboard.messageCount} />
        <StatCard title={t('dashboard.stats.memories')} value={dashboard.memoryCount} />
        <StatCard title={t('dashboard.stats.vault')} value={dashboard.vaultCount} />
        <StatCard title={t('dashboard.stats.longestStreak')} value={dashboard.longestStreak} />
      </View>
      {coupleId ? <OurStats coupleId={coupleId} /> : null}
      <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
      <View style={styles.actions}>
        {quickActions.map(({ key, icon: Icon, route }) => (
          <TouchableOpacity
            key={key}
            accessibilityRole="button"
            accessibilityLabel={t(`dashboard.actions.${key}`)}
            accessibilityHint={t('dashboard.openAction')}
            style={styles.action}
            onPress={() => router.push(route)}
          >
            <Icon color={colors.accent1} size={22} />
            <Text style={styles.actionText}>{t(`dashboard.actions.${key}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.shareCard}>
        <Text style={styles.cardTitle}>{t('dashboard.anniversary')}</Text>
        <Text style={styles.anniversary}>{yearsTogether} {t('dashboard.yearsTogether')}</Text>
        <Text style={styles.muted}>
          {dashboard.anniversary ? t('dashboard.anniversaryDateLine').replace('{date}', dashboard.anniversary.slice(5)).replace('{days}', String(anniversaryDays ?? 0)) : t('dashboard.setAnniversary')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.shareOurLove')}
          accessibilityHint="Opens the device sharing options"
          style={styles.secondaryButton}
          onPress={() =>
            void Share.share({
              message: t('dashboard.shareMessage').replace('{years}', String(yearsTogether)).replace('{name}', dashboard.coupleName),
            })
          }
        >
          <Text style={styles.secondaryText}>{t('dashboard.shareOurLove')}</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={customizing}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomizing(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.customizeModal, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('dashboard.customizeHome')}</Text>
              <TouchableOpacity
                onPress={() => setCustomizing(false)}
                accessibilityLabel={t('dashboard.closeCustomization')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={colors.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            {dashboardLayout.order.map((id, index) => (
              <View key={id} style={[styles.widgetRow, { borderColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={[
                    styles.visibilityToggle,
                    {
                      backgroundColor: dashboardLayout.visibility[id]
                        ? colors.accent1
                        : colors.surface,
                    },
                  ]}
                  onPress={() =>
                    updateLayout({
                      ...dashboardLayout,
                      visibility: {
                        ...dashboardLayout.visibility,
                        [id]: !dashboardLayout.visibility[id],
                      },
                    })
                  }
                >
                  <Text
                    style={{
                      color: dashboardLayout.visibility[id]
                        ? colors.accentForeground
                        : colors.textSecondary,
                    }}
                  >
                    {dashboardLayout.visibility[id] ? t('dashboard.shown') : t('dashboard.hidden')}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.widgetLabel, { color: colors.textPrimary }]}>
                  {t(widgetLabels[id])}
                </Text>
                <TouchableOpacity
                  onPress={() => moveWidget(id, -1)}
                  disabled={index === 0}
                  accessibilityLabel={`${t('dashboard.moveWidgetUp')}: ${t(widgetLabels[id])}`}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronUp
                    color={index === 0 ? colors.textSecondary : colors.textPrimary}
                    size={20}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveWidget(id, 1)}
                  disabled={index === dashboardLayout.order.length - 1}
                  accessibilityLabel={`${t('dashboard.moveWidgetDown')}: ${t(widgetLabels[id])}`}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronDown
                    color={
                      index === dashboardLayout.order.length - 1
                        ? colors.textSecondary
                        : colors.textPrimary
                    }
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            ))}
            {layoutError ? (
              <Text style={[styles.error, { color: colors.error }]}>{layoutError}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
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
    heroRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroTextWrap: {
      flex: 1,
    },
    eyebrow: {
      color: colors.accent2,
      fontSize: sizes.text.xs,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
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
    heroLabel: { color: colors.textSecondary, fontSize: sizes.text.xs, letterSpacing: 1.6 },
    heroValue: { color: colors.accent1, fontSize: 42, fontWeight: '800', marginTop: 6 },
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
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: sizes.text.bodyLg,
      fontWeight: '800',
      marginTop: 8,
    },
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
    actionText: {
      color: colors.textPrimary,
      fontSize: sizes.text.xs,
      textAlign: 'center',
      fontWeight: '700',
    },
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
    countdown: {
      color: colors.accent1,
      fontSize: sizes.text.hMd,
      fontWeight: '800',
      marginTop: 12,
    },
    memoryImage: { width: '100%', height: 170, borderRadius: sizes.radius.btn, marginTop: 12 },
    memoryTitle: {
      color: colors.textPrimary,
      fontSize: sizes.text.bodyLg,
      fontWeight: '700',
      marginTop: 12,
    },
    careValue: {
      color: colors.success,
      fontSize: sizes.text.hMd,
      fontWeight: '800',
      marginTop: 10,
    },
    musicTitle: {
      color: colors.textPrimary,
      fontSize: sizes.text.bodyLg,
      fontWeight: '700',
      marginTop: 12,
    },
    anniversary: {
      color: colors.accent1,
      fontSize: sizes.text.hMd,
      fontWeight: '800',
      marginTop: 10,
    },
    muted: { color: colors.textSecondary, fontSize: sizes.text.sm, marginTop: 6 },
    error: { color: colors.error, textAlign: 'center' },
    primaryButton: {
      backgroundColor: colors.accent1,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: sizes.radius.input,
    },
    primaryText: { color: colors.accentForeground, fontWeight: '800' },
    secondaryButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent2,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: sizes.radius.input,
      marginTop: 14,
    },
    secondaryText: { color: colors.textPrimary, fontWeight: '800' },
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
    visibilityToggle: {
      borderRadius: sizes.radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    widgetLabel: { flex: 1, fontWeight: '700' },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: sizes.radius.input,
      paddingHorizontal: sizes.space.md,
      paddingVertical: sizes.space.sm,
      marginBottom: sizes.space.md,
    },
    streakLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.space.xs,
    },
    streakCount: {
      fontSize: sizes.text.body,
      fontWeight: '700',
    },
    streakAction: {
      fontSize: sizes.text.sm,
      fontWeight: '600',
    },
  })
