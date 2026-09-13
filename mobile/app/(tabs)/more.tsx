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
} from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTranslation } from '@/i18n/useTranslation'
import { useAuth } from '@/lib/auth'

const items = [
  { href: '/(tabs)/plans', key: 'plans', Icon: CalendarDays },
  { href: '/(tabs)/memories', key: 'ourMemories', Icon: HeartPulse },
  { href: '/(tabs)/our-story', key: 'ourStory', Icon: BookHeart },
  { href: '/(tabs)/wellness', key: 'wellness', Icon: HeartPulse },
  { href: '/(tabs)/settings', key: 'settings', Icon: Settings },
  { href: '/(tabs)/location', key: 'locationSafety', Icon: MapPin },
  { href: '/(tabs)/ai', key: 'aiGuardian', Icon: Sparkles },
  { href: '/(tabs)/finance', key: 'finance', Icon: HeartPulse },
  { href: '/(tabs)/profile', key: 'profile', Icon: LogOut },
  { href: '/(tabs)/music', key: 'music', Icon: Music2 },
  { href: '/(tabs)/vault', key: 'privateVault', Icon: LockKeyhole },
  { href: '/(tabs)/astrology', key: 'astrology', Icon: Moon },
  { href: '/(tabs)/games', key: 'coupleGames', Icon: Gamepad2 },
  { href: '/(tabs)/time-capsules', key: 'timeCapsules', Icon: Hourglass },
  { href: '/(tabs)/calls', key: 'calls', Icon: Phone },
  { href: '/(tabs)/couple-linking', key: 'coupleLinking', Icon: Users },
  { href: '/(tabs)/privacy', key: 'privacy', Icon: Shield },
  { href: '/(tabs)/help', key: 'helpCenter', Icon: CircleHelp },
  { href: '/(tabs)/about', key: 'about', Icon: Info },
  { href: '/(tabs)/terms', key: 'terms', Icon: FileText },
  { href: '/(tabs)/watch-together', key: 'watchTogether', Icon: MonitorPlay },
  { href: '/(tabs)/lists', key: 'lists', Icon: ListChecks },
  { href: '/(tabs)/reminders', key: 'reminders', Icon: Bell },
] as const

export default function MoreScreen() {
  const { signOut } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t('nav.more')}</Text>
      <Text style={styles.title}>{t('nav.everythingElse')}</Text>
      <View style={styles.grid}>
        {items.map(({ href, key, Icon }) => {
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
              <Icon size={22} color="#d9bfd7" />
              <Text style={styles.label}>{label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('nav.signOut')}
        accessibilityHint={t('nav.signOut')}
        onPress={() => void signOut()}
        style={styles.logout}
      >
        <LogOut size={18} color="#ff9b9b" />
        <Text style={styles.logoutText}>{t('nav.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72 },
  eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    minHeight: 105,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#171b22',
    borderWidth: 1,
    borderColor: '#2a2d35',
    gap: 12,
  },
  label: { color: '#f3f0f5', fontSize: 14, fontWeight: '600' },
  logout: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#2f1f22',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: { color: '#ff9b9b', fontWeight: '700' },
})
