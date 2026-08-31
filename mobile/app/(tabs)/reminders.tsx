import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useNotifications } from '@/hooks/useNotifications'

export default function RemindersScreen() {
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
        <Text style={styles.input}>{draftTitle || 'Daily check-in'}</Text>
        <Text style={styles.label}>Message</Text>
        <Text style={styles.input}>
          {draftMessage || 'Take a moment to check in with each other.'}
        </Text>
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleAddReminder()}>
        <Text style={styles.secondaryText}>Add reminder</Text>
      </TouchableOpacity>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {reminders.length === 0 ? (
          <Text style={styles.empty}>No reminders yet. Create one to keep the love flowing.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  pill: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#b88ae5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryText: {
    color: '#110d1a',
    fontWeight: '700',
  },
  form: {
    backgroundColor: '#171b22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
    marginBottom: 16,
  },
  label: {
    color: '#8d8d99',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    color: '#f3f0f5',
    fontSize: 15,
    paddingVertical: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#1f3b2f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryText: {
    color: '#f3f0f5',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  empty: {
    color: '#c4c4ce',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  cardTitle: {
    color: '#f3f0f5',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  cardMessage: {
    color: '#c4c4ce',
    fontSize: 14,
    marginBottom: 8,
  },
  cardTime: {
    color: '#d9bfd7',
    fontSize: 12,
  },
})
