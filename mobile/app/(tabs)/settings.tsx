import AsyncStorage from '@react-native-async-storage/async-storage'
import * as LocalAuthentication from 'expo-local-authentication'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { WebView } from 'react-native-webview'

import { useTheme, type ThemeColors, type ThemePreference } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { useLocation } from '@/hooks/useLocation'
import { useTranslation } from '@/i18n/useTranslation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import {
  registerForPushNotifications,
  sendLocalNotification,
  updateSafetyNotificationPreference,
  getSafetyNotificationPreferences,
  type SafetyNotificationPreference,
} from '@/services/notifications'
import {
  exportSettingsData,
  getSettingsData,
  saveCouple,
  saveHealthProfile,
  saveLocalSecurity,
  savePrivacy,
  unlinkCouple,
  type SettingsData,
} from '@/services/settings'

type NotificationSettings = {
  pushEnabled: boolean
  reminders: boolean
  messages: boolean
  milestones: boolean
  wellness: boolean
}
const safetyNotificationItems: { key: SafetyNotificationPreference; translationKey: string }[] = [
  { key: 'geofence', translationKey: 'settings.safetyNotifications.geofence' },
  { key: 'battery_low', translationKey: 'settings.safetyNotifications.batteryLow' },
  { key: 'missed_checkin', translationKey: 'settings.safetyNotifications.missedCheckin' },
]
const notificationKey = 'a-little-world-with-us-mobile-notification-settings'
const defaults: NotificationSettings = {
  pushEnabled: false,
  reminders: true,
  messages: true,
  milestones: true,
  wellness: true,
}
const privacyLabels = [
  ['allow_ai_read_mood', 'Allow AI to read mood'],
  ['allow_ai_read_cycle', 'Allow AI to read cycle'],
  ['allow_ai_read_chat', 'Allow AI to read chat'],
  ['allow_ai_read_location', 'Allow AI to read location'],
  ['allow_ai_read_finance', 'Allow AI to read finance'],
  ['share_cycle', 'Share cycle data'],
  ['share_mood', 'Share mood data'],
  ['share_location', 'Share location'],
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.cardBorder, true: colors.accent2 }}
      />
    </View>
  )
}
function Button({
  title,
  onPress,
  danger = false,
  disabled = false,
}: {
  title: string
  onPress: () => void
  danger?: boolean
  disabled?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  return (
    <TouchableOpacity
      disabled={disabled}
      style={[styles.button, danger && styles.dangerButton, disabled && { opacity: 0.55 }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { preference, setPreference, colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const { locale, setLocale, t } = useTranslation()
  const {
    isSharing,
    lastUpdated,
    error: locationError,
    toggleSharing,
    refreshSharingStatus,
  } = useLocation()
  const [data, setData] = useState<SettingsData | null>(null)
  const [notifications, setNotifications] = useState(defaults)
  const [safetyNotifications, setSafetyNotifications] = useState<
    Record<SafetyNotificationPreference, boolean>
  >({
    geofence: true,
    battery_low: true,
    missed_checkin: true,
  })
  const [health, setHealth] = useState<SettingsData['health']>({
    age: '',
    weight: '',
    height: '',
    conditions: '',
    medications: '',
    allergies: '',
  })
  const [privacy, setPrivacy] = useState<Record<string, boolean>>({})
  const [name, setName] = useState('')
  const [anniversary, setAnniversary] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaQrCode, setMfaQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaVisible, setMfaVisible] = useState(false)
  const [mfaBusy, setMfaBusy] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const [next, savedNotifications, savedSafetyNotifications] = await Promise.all([
        getSettingsData(),
        AsyncStorage.getItem(notificationKey),
        getSafetyNotificationPreferences(),
      ])
      setData(next)
      setHealth(next.health)
      setPrivacy(next.privacy)
      setName(next.coupleName ?? '')
      setAnniversary(next.anniversary ?? '')
      if (savedNotifications) setNotifications({ ...defaults, ...JSON.parse(savedNotifications) })
      setSafetyNotifications(savedSafetyNotifications)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load settings.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  useEffect(() => {
    let active = true
    void supabase.auth.mfa.listFactors().then(({ data, error: factorError }) => {
      if (active && !factorError)
        setMfaEnabled((data?.totp ?? []).some((factor) => factor.status === 'verified'))
    })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!loading) void AsyncStorage.setItem(notificationKey, JSON.stringify(notifications))
  }, [loading, notifications])
  const toggleSafetyNotification = async (key: SafetyNotificationPreference, value: boolean) => {
    setSafetyNotifications((current) => ({ ...current, [key]: value }))
    try {
      await updateSafetyNotificationPreference(key, value)
    } catch (caught) {
      setSafetyNotifications((current) => ({ ...current, [key]: !value }))
      Alert.alert(
        'Notifications',
        caught instanceof Error ? caught.message : 'Unable to save preference.'
      )
    }
  }
  const saveHealth = async () => {
    if (!user) return
    try {
      await saveHealthProfile(user.id, health)
      Alert.alert('Saved', 'Health profile updated.')
    } catch (caught) {
      Alert.alert(
        'Unable to save',
        caught instanceof Error ? caught.message : 'Please check your values.'
      )
    }
  }
  const savePrivacySettings = async () => {
    if (!user) return
    try {
      await savePrivacy(user.id, privacy)
      Alert.alert('Saved', 'Privacy settings updated.')
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  const saveCoupleSettings = async () => {
    if (!data?.coupleId) return
    try {
      await saveCouple(data.coupleId, anniversary, name)
      Alert.alert('Saved', 'Couple settings updated.')
    } catch (caught) {
      Alert.alert('Unable to save', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  const exportData = async (kind: 'photos' | 'chat' | 'care' | 'finance') => {
    if (!data?.coupleId) return
    try {
      const content = await exportSettingsData(data.coupleId, kind)
      await Share.share({
        title: `${kind} export.${kind === 'chat' ? 'json' : 'csv'}`,
        message: content,
      })
    } catch (caught) {
      Alert.alert(
        'Export failed',
        caught instanceof Error ? caught.message : 'Unable to export data.'
      )
    }
  }
  const security = async (enabled: boolean) => {
    if (!user) return
    try {
      await saveLocalSecurity(
        user.id,
        enabled,
        data?.biometricEnabled ?? false,
        enabled ? pin : undefined
      )
      setData((current) => (current ? { ...current, pinEnabled: enabled } : current))
    } catch (caught) {
      Alert.alert('Security', caught instanceof Error ? caught.message : 'Unable to update PIN.')
    }
  }
  const startMfaSetup = async () => {
    setMfaBusy(true)
    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError
      const verified = factors?.totp.find((factor) => factor.status === 'verified')
      if (verified) {
        setMfaEnabled(true)
        Alert.alert('အသုံးပြုနေပြီးပါပြီ', 'အကောင့်မှာ အတည်ပြုမှုအဆင့် ၂ ဖွင့်ထားပြီးပါပြီ။')
        return
      }
      const pending = factors?.all.find(
        (factor) => factor.factor_type === 'totp' && factor.status === 'unverified'
      )
      if (pending) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pending.id })
        if (removeError) throw removeError
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'A Little World With Us',
      })
      if (enrollError) throw enrollError
      setMfaFactorId(data.id)
      setMfaQrCode(data.totp.qr_code)
      setMfaSecret(data.totp.secret)
      setMfaCode('')
      setMfaVisible(true)
    } catch (caught) {
      Alert.alert(
        'စနစ်ထည့်သွင်းမှု မအောင်မြင်ပါ',
        caught instanceof Error ? caught.message : 'ပြန်ကြိုးစားပါ။'
      )
    } finally {
      setMfaBusy(false)
    }
  }
  const verifyMfaSetup = async () => {
    if (!mfaFactorId || !/^\d{6}$/.test(mfaCode)) return
    setMfaBusy(true)
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      })
      if (challengeError) throw challengeError
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      })
      if (verifyError) throw verifyError
      setMfaEnabled(true)
      setMfaVisible(false)
      setMfaFactorId('')
      setMfaQrCode('')
      setMfaSecret('')
      setMfaCode('')
      Alert.alert('ပြီးပါပြီ', 'အတည်ပြုမှုအဆင့် ၂ ကို ဖွင့်ပြီးပါပြီ။')
    } catch (caught) {
      Alert.alert(
        'ကုဒ်အတည်မပြုနိုင်ပါ',
        caught instanceof Error ? caught.message : 'ကုဒ်ကို ပြန်စစ်ပါ။'
      )
    } finally {
      setMfaBusy(false)
    }
  }
  const cancelMfaSetup = async () => {
    if (mfaFactorId) await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
    setMfaVisible(false)
    setMfaFactorId('')
    setMfaQrCode('')
    setMfaSecret('')
    setMfaCode('')
  }
  const disableMfa = () => {
    Alert.alert('အဆင့် ၂ ကို ပိတ်မလား', 'အကောင့်ဝင်ရာတွင် အတည်ပြုအက်ပ်ကုဒ်ကို ထပ်မတောင်းတော့ပါ။', [
      { text: 'မပိတ်တော့ပါ', style: 'cancel' },
      {
        text: 'ပိတ်ရန်',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setMfaBusy(true)
            try {
              const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
              if (factorsError) throw factorsError
              const verified = factors?.totp.find((factor) => factor.status === 'verified')
              if (!verified) throw new Error('အတည်ပြုထားသော စနစ် မတွေ့ပါ။')
              const { error: removeError } = await supabase.auth.mfa.unenroll({
                factorId: verified.id,
              })
              if (removeError) throw removeError
              setMfaEnabled(false)
              Alert.alert('ပြီးပါပြီ', 'အတည်ပြုမှုအဆင့် ၂ ကို ပိတ်ပြီးပါပြီ။')
            } catch (caught) {
              Alert.alert('ပိတ်မရပါ', caught instanceof Error ? caught.message : 'ပြန်စမ်းကြည့်ပါ။')
            } finally {
              setMfaBusy(false)
            }
          })()
        },
      },
    ])
  }
  const biometric = async (enabled: boolean) => {
    if (!user) return
    if (enabled && !(await LocalAuthentication.hasHardwareAsync())) {
      Alert.alert('Biometrics', 'This device does not support biometric authentication.')
      return
    }
    await saveLocalSecurity(user.id, data?.pinEnabled ?? false, enabled)
    setData((current) => (current ? { ...current, biometricEnabled: enabled } : current))
  }
  if (loading)
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading settings...</Text>
      </View>
    )
  if (!data)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Retry" onPress={() => void load()} />
      </View>
    )
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Settings</Text>
      <Text style={styles.title}>Your shared world</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Section title="Notifications">
        <Toggle
          label={`Push notifications · ${notifications.pushEnabled ? 'Enabled' : 'Off'}`}
          value={notifications.pushEnabled}
          onChange={async (value) => {
            if (value) {
              const token = await registerForPushNotifications()
              if (!token)
                return Alert.alert(
                  'Notifications',
                  'Push notifications are unavailable on this device.'
                )
              await sendLocalNotification(
                'Love reminders ready',
                'Your gentle connection nudges are enabled.'
              )
            }
            setNotifications((current) => ({ ...current, pushEnabled: value }))
          }}
        />
        {(['reminders', 'messages', 'milestones', 'wellness'] as const).map((key) => (
          <Toggle
            key={key}
            label={key[0].toUpperCase() + key.slice(1)}
            value={notifications[key]}
            onChange={(value) => setNotifications((current) => ({ ...current, [key]: value }))}
          />
        ))}
        {safetyNotificationItems.map(({ key, translationKey }) => (
          <Toggle
            key={key}
            label={t(translationKey)}
            value={safetyNotifications[key]}
            onChange={(value) => void toggleSafetyNotification(key, value)}
          />
        ))}
      </Section>
      <Section title="Appearance">
        <View style={styles.options}>
          {(
            [
              'lavender-mist',
              'peach-cream',
              'mint-whisper',
              'ocean-calm',
              'monochrome',
            ] as ThemePreference[]
          ).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setPreference(option)}
              style={[styles.option, preference === option && styles.optionActive]}
            >
              <Text style={styles.buttonText}>
                {option === 'lavender-mist'
                  ? 'Lavender Mist'
                  : option === 'peach-cream'
                    ? 'Peach Cream'
                    : option === 'mint-whisper'
                      ? 'Mint Whisper'
                      : option === 'ocean-calm'
                        ? 'Ocean Calm'
                        : 'Monochrome'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Section>
      <Section title="Couple settings">
        <Text style={styles.muted}>Partner: {data.partnerEmail ?? 'Not linked'}</Text>
        <Text style={styles.muted}>Status: {data.relationshipStatus}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Couple name"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TextInput
          value={anniversary}
          onChangeText={setAnniversary}
          placeholder="Anniversary (YYYY-MM-DD)"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <Button title="Save couple settings" onPress={() => void saveCoupleSettings()} />
        {data.coupleId ? (
          <Button
            title="Unlink couple"
            danger
            onPress={() =>
              Alert.alert('Unlink couple?', 'This revokes the accepted link.', [
                { text: 'Cancel' },
                {
                  text: 'Unlink',
                  style: 'destructive',
                  onPress: () =>
                    supabase
                      .from('couple_links')
                      .select('id')
                      .eq('couple_id', data.coupleId)
                      .eq('status', 'accepted')
                      .maybeSingle()
                      .then(
                        ({ data: link }) =>
                          link &&
                          unlinkCouple(link.id)
                            .then(load)
                            .catch((caught) =>
                              setError(
                                caught instanceof Error ? caught.message : 'Unable to unlink.'
                              )
                            )
                      ),
                },
              ])
            }
          />
        ) : null}
      </Section>
      <Section title="Health profile">
        <TextInput
          value={health.age}
          onChangeText={(value) => setHealth((current) => ({ ...current, age: value }))}
          placeholder="Age (1-120)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={health.weight}
          onChangeText={(value) => setHealth((current) => ({ ...current, weight: value }))}
          placeholder="Weight kg (1-300)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TextInput
          value={health.height}
          onChangeText={(value) => setHealth((current) => ({ ...current, height: value }))}
          placeholder="Height cm (50-250)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        {(['conditions', 'medications', 'allergies'] as const).map((key) => (
          <TextInput
            key={key}
            value={health[key]}
            onChangeText={(value) => setHealth((current) => ({ ...current, [key]: value }))}
            placeholder={`${key[0].toUpperCase() + key.slice(1)} (comma separated)`}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
        ))}
        <Button title="Save health profile" onPress={() => void saveHealth()} />
      </Section>
      <Section title="Privacy controls">
        {privacyLabels.map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            value={Boolean(privacy[key])}
            onChange={(value) => setPrivacy((current) => ({ ...current, [key]: value }))}
          />
        ))}
        <Button title="Save privacy settings" onPress={() => void savePrivacySettings()} />
      </Section>
      <Section title="Exports">
        <Button title="Export photos (CSV)" onPress={() => void exportData('photos')} />
        <Button title="Export chat (JSON)" onPress={() => void exportData('chat')} />
        <Button title="Export Care data (CSV)" onPress={() => void exportData('care')} />
        <Button title="Export finance (CSV)" onPress={() => void exportData('finance')} />
      </Section>
      <Section title="Security">
        <Toggle
          label="PIN lock"
          value={data.pinEnabled}
          onChange={(value) =>
            value
              ? Alert.alert('Set PIN', 'Enter a PIN below, then tap Set PIN.')
              : void security(false)
          }
        />
        {!data.pinEnabled ? (
          <>
            <TextInput
              value={pin}
              onChangeText={setPin}
              placeholder="New PIN (4-6 digits)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              secureTextEntry
              style={styles.input}
            />
            <Button title="Set PIN" onPress={() => void security(true)} />
          </>
        ) : (
          <Button title="Remove PIN" danger onPress={() => void security(false)} />
        )}
        <Toggle
          label="Biometric authentication"
          value={data.biometricEnabled}
          onChange={(value) => void biometric(value)}
        />
        <Button
          title={mfaEnabled ? 'Turn off two-factor verification' : 'Set up two-factor verification'}
          onPress={() => (mfaEnabled ? disableMfa() : void startMfaSetup())}
          disabled={mfaBusy}
        />
        <Button title="Log out" danger onPress={() => void signOut()} />
      </Section>
      <Section title="Favorites">
        <Text style={styles.muted}>Quick access to the spaces you use most.</Text>
        <View style={styles.options}>
          <Button title="Chat" onPress={() => router.push('/chat')} />
          <Button title="Care" onPress={() => router.push('/care')} />
          <Button title="Memories" onPress={() => router.push('/memories')} />
        </View>
      </Section>
      <Section title="Reminders">
        <Text style={styles.muted}>Manage your gentle care and connection nudges.</Text>
        <Button title="Open reminders" onPress={() => router.push('/reminders')} />
      </Section>
      <Section title={t('settings.language')}>
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, locale === 'my' && styles.optionActive]}
            onPress={async () => {
              await AsyncStorage.setItem('a-little-world-with-us-language', 'my')
              setLocale('my')
              setData((current) => (current ? { ...current, language: 'my' } : current))
            }}
          >
            <Text style={styles.buttonText}>မြန်မာ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, locale === 'en' && styles.optionActive]}
            onPress={async () => {
              await AsyncStorage.setItem('a-little-world-with-us-language', 'en')
              setLocale('en')
              setData((current) => (current ? { ...current, language: 'en' } : current))
            }}
          >
            <Text style={styles.buttonText}>English</Text>
          </TouchableOpacity>
        </View>
      </Section>
      <Section title="Location sharing">
        <Toggle
          label={isSharing ? 'Sharing active' : 'Location private'}
          value={isSharing}
          onChange={(value) => void toggleSharing(value).then(refreshSharingStatus)}
        />
        {lastUpdated ? (
          <Text style={styles.muted}>Last sync {new Date(lastUpdated).toLocaleTimeString()}</Text>
        ) : null}
        {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
      </Section>
      <Modal
        visible={mfaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMfaVisible(false)}
      >
        <View style={styles.mfaOverlay}>
          <View style={styles.mfaPanel}>
            <Text style={styles.sectionTitle}>အတည်ပြုအက်ပ် ချိတ်ဆက်ရန်</Text>
            <Text style={styles.muted}>
              အတည်ပြုအက်ပ်ကို ဖွင့်ပြီး QR ပုံကို ဖတ်ပါ။ ပြင်ပဝဘ်ဆိုဒ်သို့ မပို့ပါ။
            </Text>
            {mfaQrCode ? (
              <WebView
                originWhitelist={['*']}
                javaScriptEnabled={false}
                source={{
                  html: `<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;display:grid;place-items:center;height:100vh;background:white"><img width="220" height="220" src="${mfaQrCode.replace(/"/g, '&quot;')}" /></body></html>`,
                }}
                style={styles.qrPreview}
              />
            ) : null}
            <Text style={styles.muted}>QR ဖတ်ပြီးနောက် အတည်ပြုအက်ပ်မှ ဂဏန်း ၆ လုံးကို ထည့်ပါ။</Text>
            <Text selectable style={styles.mfaSecret}>
              {mfaSecret}
            </Text>
            <TextInput
              value={mfaCode}
              onChangeText={(value) => setMfaCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="ဂဏန်း ၆ လုံး"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />
            <Button
              title={mfaBusy ? 'စစ်ဆေးနေသည်…' : 'ကုဒ်အတည်ပြုရန်'}
              onPress={() => void verifyMfaSetup()}
              disabled={mfaBusy || mfaCode.length !== 6}
            />
            <Button title="မလုပ်တော့ပါ" onPress={() => void cancelMfaSetup()} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: colors.background,
      paddingTop: 72,
      paddingBottom: 40,
      paddingHorizontal: 20,
      gap: 14,
    },
    center: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 14,
      padding: 24,
    },
    eyebrow: {
      color: colors.accent2,
      fontSize: sizes.text.xs,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    title: { color: colors.textPrimary, fontSize: sizes.text.hLg, fontWeight: '700' },
    section: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 10,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: sizes.text.bodyLg,
      fontWeight: '700',
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    label: { color: colors.textPrimary, flex: 1 },
    muted: { color: colors.textSecondary, fontSize: sizes.text.sm },
    error: { color: colors.error },
    input: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.input,
      color: colors.textPrimary,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    button: {
      backgroundColor: colors.accent1,
      padding: 13,
      borderRadius: sizes.radius.input,
      alignItems: 'center',
      marginTop: 4,
    },
    dangerButton: { backgroundColor: colors.error },
    buttonText: { color: colors.background, fontWeight: '800' },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: {
      backgroundColor: colors.surface,
      minWidth: 90,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: sizes.radius.input,
    },
    optionActive: { backgroundColor: colors.accent1 },
    mfaOverlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    mfaPanel: {
      gap: 12,
      padding: 20,
      borderRadius: sizes.radius.card,
      backgroundColor: colors.surface,
    },
    qrPreview: { height: 230, borderRadius: 12, backgroundColor: '#fff' },
    mfaSecret: {
      padding: 10,
      borderRadius: 8,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      textAlign: 'center',
      fontFamily: 'monospace',
      fontSize: sizes.text.xs,
    },
  })
