import { useRouter } from 'expo-router'
import {
  ChevronDown,
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
  Phone,
  Users,
  Shield,
  CircleHelp,
  Info,
  FileText,
  MonitorPlay,
  ListChecks,
  Bell,
  Languages,
  Home,
} from 'lucide-react-native'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { useTranslation } from '@/i18n/useTranslation'
import { useAuth } from '@/lib/auth'

const sections = [
  {
    title: 'Home',
    items: [{ href: '/(tabs)/index', key: 'home', Icon: Home }],
  },
  {
    title: 'Plans',
    items: [
      { href: '/(tabs)/plans', key: 'plans', Icon: CalendarDays },
      { href: '/(tabs)/reminders', key: 'reminders', Icon: Bell },
      { href: '/(tabs)/lists', key: 'lists', Icon: ListChecks },
      { href: '/(tabs)/finance', key: 'finance', Icon: HeartPulse },
    ],
  },
  {
    title: 'Memories',
    items: [{ href: '/(tabs)/memories', key: 'ourMemories', Icon: HeartPulse }],
  },
  {
    title: 'Connection',
    items: [
      { href: '/(tabs)/chat', key: 'chat', Icon: Phone },
      { href: '/(tabs)/calls', key: 'calls', Icon: Phone },
      { href: '/(tabs)/couple-linking', key: 'coupleLinking', Icon: Users },
      { href: '/(tabs)/location', key: 'locationSafety', Icon: MapPin },
    ],
  },
  {
    title: 'Care and Play',
    items: [
      { href: '/(tabs)/wellness', key: 'wellness', Icon: HeartPulse },
      { href: '/(tabs)/music', key: 'music', Icon: Music2 },
      { href: '/(tabs)/learning', key: 'learning', Icon: Languages },
      { href: '/(tabs)/games', key: 'coupleGames', Icon: Gamepad2 },
      { href: '/(tabs)/watch-together', key: 'watchTogether', Icon: MonitorPlay },
      { href: '/(tabs)/ai', key: 'aiGuardian', Icon: Sparkles },
      { href: '/(tabs)/astrology', key: 'astrology', Icon: Moon },
    ],
  },
  {
    title: 'Account and Help',
    items: [
      { href: '/(tabs)/settings', key: 'settings', Icon: Settings },
      { href: '/(tabs)/privacy', key: 'privacy', Icon: Shield },
      { href: '/(tabs)/profile', key: 'profile', Icon: LogOut },
      { href: '/(tabs)/vault', key: 'privateVault', Icon: LockKeyhole },
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
  const insets = useSafeAreaInsets()
  const styles = createStyles(colors, sizes)
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.eyebrow}>{t('nav.more')}</Text>
      <Text style={styles.title}>{t('nav.everythingElse')}</Text>
      {sections.map(({ title: sectionTitle, items: sectionItems }) => (
        <View key={sectionTitle} style={styles.section}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ expanded: !collapsed[sectionTitle] }}
            onPress={() =>
              setCollapsed((current) => ({ ...current, [sectionTitle]: !current[sectionTitle] }))
            }
            style={styles.sectionToggle}
          >
            <Text style={styles.sectionHeader}>{sectionTitle}</Text>
            <ChevronDown
              size={18}
              color={colors.accent2}
              style={collapsed[sectionTitle] ? undefined : styles.chevronOpen}
            />
          </TouchableOpacity>
          {!collapsed[sectionTitle] ? (
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
          ) : null}
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

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.background, padding: 20, paddingTop: 72 },
    eyebrow: {
      color: colors.accent2,
      fontSize: sizes.text.xs,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.textPrimary,
      fontSize: sizes.text.hLg,
      fontWeight: '700',
      marginTop: 8,
      marginBottom: 22,
    },
    section: { marginTop: 20 },
    sectionToggle: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    chevronOpen: { transform: [{ rotate: '180deg' }] },
    sectionHeader: {
      fontSize: sizes.text.xs,
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
      borderRadius: sizes.radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
    },
    label: { color: colors.textPrimary, fontSize: sizes.text.sm, fontWeight: '600' },
    logout: {
      marginTop: 24,
      padding: 16,
      borderRadius: sizes.radius.input,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoutText: { color: colors.error, fontWeight: '700' },
  })
