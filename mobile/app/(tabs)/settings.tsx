import AsyncStorage from '@react-native-async-storage/async-storage'
import { Bell, Heart, MessageSquareText, Sparkles } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'

import { registerForPushNotifications, sendLocalNotification } from '@/services/notifications'

type NotificationChannel = 'reminders' | 'messages' | 'milestones' | 'wellness'

type NotificationSettings = {
  pushEnabled: boolean
  reminders: boolean
  messages: boolean
  milestones: boolean
  wellness: boolean
}

const defaultSettings: NotificationSettings = {
  pushEnabled: false,
  reminders: true,
  messages: true,
  milestones: true,
  wellness: true,
}

const toggleItems: {
  key: NotificationChannel
  label: string
  description: string
  icon: typeof Bell
}[] = [
  {
    key: 'reminders',
    label: 'Reminders',
    description: 'Gentle nudges for dates and rituals.',
    icon: Bell,
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'Chat and reply alerts.',
    icon: MessageSquareText,
  },
  {
    key: 'milestones',
    label: 'Milestones',
    description: 'Anniversaries and special moments.',
    icon: Sparkles,
  },
  { key: 'wellness', label: 'Wellness', description: 'Daily care prompts.', icon: Heart },
]

const STORAGE_KEY = 'our-forever-mobile-notification-settings'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (saved) {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) })
        }
      } catch {
        // ignore malformed storage
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [])

  useEffect(() => {
    if (loading) return
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [loading, settings])

  const updateSetting = (key: NotificationChannel, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const handleEnable = async () => {
    try {
      const token = await registerForPushNotifications()
      if (!token) {
        Alert.alert('Notifications', 'Push notifications are not enabled on this device.')
        return
      }

      setSettings((current) => ({ ...current, pushEnabled: true }))
      Alert.alert('Notifications', 'Push notifications are active.')
      await sendLocalNotification(
        'Love reminders ready',
        'Your gentle connection nudges are now enabled.'
      )
    } catch {
      Alert.alert('Notifications', 'Unable to enable notifications right now.')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Settings</Text>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Keep your shared rhythm gentle, timely, and in sync.</Text>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardLabel}>Push notifications</Text>
            <Text style={styles.cardValue}>{settings.pushEnabled ? 'Enabled' : 'Off'}</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => void handleEnable()}>
            <Text style={styles.primaryButtonText}>
              {settings.pushEnabled ? 'Refresh' : 'Enable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>What to notify me about</Text>

        {toggleItems.map(({ key, label, description, icon: Icon }) => (
          <View key={key} style={styles.settingRow}>
            <View style={styles.labelWrap}>
              <View style={styles.iconWrap}>
                <Icon size={18} color="#d8b9c8" />
              </View>
              <View>
                <Text style={styles.settingLabel}>{label}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
              </View>
            </View>

            <Switch
              value={settings[key]}
              onValueChange={(value) => updateSetting(key, value)}
              trackColor={{ false: '#2a2d36', true: '#d8b9c8' }}
              thumbColor="#ffffff"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#c4c4ce',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardLabel: {
    color: '#8d8d99',
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    color: '#f3f0f5',
    fontSize: 20,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#d8b9c8',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#0f0f12',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCard: {
    backgroundColor: '#171b22',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  sectionTitle: {
    color: '#f3f0f5',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2d35',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#d8b9c8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    color: '#f3f0f5',
    fontWeight: '600',
    fontSize: 15,
  },
  settingDescription: {
    color: '#b9bac4',
    fontSize: 12,
    marginTop: 2,
  },
})
