import { useState } from 'react'
import { Bell } from 'lucide-react-native'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useNotifications } from '@/hooks/useNotifications'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/context/ThemeContext'

export default function RemindersScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const { permissionStatus, reminders, addReminder, triggerTest } = useNotifications()
  const [draftTitle, setDraftTitle] = useState('')
  const [draftMessage, setDraftMessage] = useState('')

  const handleAddReminder = async () => {
    if (!draftTitle.trim() || !draftMessage.trim()) {
      Alert.alert('Missing details', 'Add a title and message before saving.')
      return
    }

    await addReminder(
      draftTitle.trim(),
      draftMessage.trim(),
      new Date(Date.now() + 3600000).toISOString()
    )
    setDraftTitle('')
    setDraftMessage('')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reminders</Text>
      <Text style={styles.pill}>Permission: {permissionStatus}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => void triggerTest()}>
        <Text style={styles.primaryText}>Test notification</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={draftTitle}
          onChangeText={setDraftTitle}
          placeholder="Daily check-in"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <Text style={styles.label}>Message</Text>
        <TextInput
          value={draftMessage}
          onChangeText={setDraftMessage}
          placeholder="Take a moment to check in with each other."
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleAddReminder()}>
        <Text style={styles.secondaryText}>Add reminder</Text>
      </TouchableOpacity>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No reminders yet"
            description="Create one to keep the love flowing."
          />
        ) : (
          reminders.map((reminder) => (
            <View key={reminder.id} style={styles.card}>
              <Text style={styles.cardTitle}>{reminder.title}</Text>
              <Text style={styles.cardMessage}>{reminder.message}</Text>
              <Text style={styles.cardTime}>
                {new Date(reminder.scheduled_at).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  pill: {
    color: colors.accent2,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: colors.accent1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryText: {
    color: colors.background,
    fontWeight: '700',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: colors.accent1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryText: {
    color: colors.background,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  empty: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  cardMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  cardTime: {
    color: colors.accent2,
    fontSize: 12,
  },
})
