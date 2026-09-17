import { useRouter } from 'expo-router'
import {
  LogOut,
  Settings,
  MapPin,
  CalendarDays,
  HeartPulse,
  Sparkles,
  Music2,
  LockKeyhole,
  Moon,
  Gamepad2,
  Hourglass,
  Phone,
  Users,
  Shield,
  CircleHelp,
  Info,
  FileText,
  MonitorPlay,
  ListChecks,
  Bell,
  BookHeart,
  Languages,
} from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTranslation } from '@/i18n/useTranslation'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/context/ThemeContext'

const sections = [
  {
    title: 'Daily',
    items: [
      { href: '/(tabs)/plans', key: 'plans', Icon: CalendarDays },
      { href: '/(tabs)/reminders', key: 'reminders', Icon: Bell },
      { href: '/(tabs)/lists', key: 'lists', Icon: ListChecks },
      { href: '/(tabs)/calls', key: 'calls', Icon: Phone },
    ],
  },
  {
    title: 'Shared',
    items: [
      { href: '/(tabs)/our-story', key: 'ourStory', Icon: BookHeart },
      { href: '/(tabs)/memories', key: 'ourMemories', Icon: HeartPulse },
      { href: '/(tabs)/memory-map', key: 'memoryMap', Icon: MapPin },
      { href: '/(tabs)/wellness', key: 'wellness', Icon: HeartPulse },
      { href: '/(tabs)/music', key: 'music', Icon: Music2 },
      { href: '/(tabs)/learning', key: 'learning', Icon: Languages },
      { href: '/(tabs)/location', key: 'locationSafety', Icon: MapPin },
      { href: '/(tabs)/vault', key: 'privateVault', Icon: LockKeyhole },
    ],
  },
  {
    title: 'Play',
    items: [
      { href: '/(tabs)/games', key: 'coupleGames', Icon: Gamepad2 },
      { href: '/(tabs)/watch-together', key: 'watchTogether', Icon: MonitorPlay },
      { href: '/(tabs)/time-capsules', key: 'timeCapsules', Icon: Hourglass },
    ],
  },
  {
    title: 'AI',
    items: [{ href: '/(tabs)/ai', key: 'aiGuardian', Icon: Sparkles }],
  },
  {
    title: 'Account',
    items: [
      { href: '/(tabs)/settings', key: 'settings', Icon: Settings },
      { href: '/(tabs)/privacy', key: 'privacy', Icon: Shield },
      { href: '/(tabs)/couple-linking', key: 'coupleLinking', Icon: Users },
      { href: '/(tabs)/profile', key: 'profile', Icon: LogOut },
      { href: '/(tabs)/finance', key: 'finance', Icon: HeartPulse },
      { href: '/(tabs)/astrology', key: 'astrology', Icon: Moon },
    ],
  },
  {
    title: 'Legal',
    items: [
      { href: '/(tabs)/about', key: 'about', Icon: Info },
      { href: '/(tabs)/terms', key: 'terms', Icon: FileText },
      { href: '/(tabs)/help', key: 'helpCenter', Icon: CircleHelp },
    ],
  },
] as const

export default function MoreScreen() {
  const { signOut } = useAuth()
  const router = useRouter()
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const { t } = useTranslation()
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t('nav.more')}</Text>
      <Text style={styles.title}>{t('nav.everythingElse')}</Text>
      {sections.map(({ title: sectionTitle, items: sectionItems }) => (
        <View key={sectionTitle} style={styles.section}>
          <Text style={styles.sectionHeader}>{sectionTitle}</Text>
          <View style={styles.grid}>
            {sectionItems.map(({ href, key, Icon }) => {
              const label = t(`nav.${key}`)
              return (
                <TouchableOpacity
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityHint={`Opens ${label}`}
                  style={styles.card}
                  onPress={() => router.push(href)}
                >
                  <Icon size={22} color={colors.accent2} />
                  <Text style={styles.label}>{label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ))}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('nav.signOut')}
        accessibilityHint={t('nav.signOut')}
        onPress={() => void signOut()}
        style={styles.logout}
      >
        <LogOut size={18} color={colors.error} />
        <Text style={styles.logoutText}>{t('nav.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 20, paddingTop: 72 },
  eyebrow: { color: colors.accent2, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: colors.textPrimary, fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 22 },
  section: { marginTop: 20 },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.accent3,
    marginBottom: 10,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    minHeight: 105,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  logout: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: { color: colors.error, fontWeight: '700' },
})
