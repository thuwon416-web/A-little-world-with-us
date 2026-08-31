import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { WellnessBoardShell } from './WellnessBoardShell'

type Notice = {
  id: string
  title: string
  message: string
  pinned: boolean
}

const starterNotices: Notice[] = [
  {
    id: 'n1',
    title: 'Morning thought',
    message: 'You make my whole day feel softer.',
    pinned: true,
  },
  { id: 'n2', title: 'Little reminder', message: 'I am proud of the way you care.', pinned: false },
]

export default function SweetNoticesBoard() {
  const [notices, setNotices] = useState<Notice[]>(starterNotices)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const pinnedNotices = useMemo(() => notices.filter((notice) => notice.pinned), [notices])
  const featuredPinnedNotice = pinnedNotices[0] ?? null

  const togglePin = (id: string) => {
    setNotices((current) =>
      current.map((notice) => (notice.id === id ? { ...notice, pinned: !notice.pinned } : notice))
    )
  }

  const addNotice = () => {
    const noticeTitle = title.trim()
    const noticeMessage = message.trim()
    if (!noticeTitle || !noticeMessage) {
      return
    }

    setNotices((current) => [
      ...current,
      { id: `notice-${Date.now()}`, title: noticeTitle, message: noticeMessage, pinned: false },
    ])
    setTitle('')
    setMessage('')
  }

  return (
    <WellnessBoardShell title="Sweet Notices Board" subtitle="Gentle reminders" badge="pinned">
      <View style={styles.list}>
        {notices.map((notice) => (
          <Pressable
            key={notice.id}
            onPress={() => togglePin(notice.id)}
            style={[styles.notice, notice.pinned && styles.noticePinned]}
          >
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeState}>{notice.pinned ? 'pinned' : 'note'}</Text>
            </View>
            <Text style={styles.noticeText}>{notice.message}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.form}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor="#8f8393"
          style={styles.input}
        />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Leave a sweet little reminder..."
          placeholderTextColor="#8f8393"
          multiline
          numberOfLines={2}
          style={[styles.input, styles.textArea]}
        />
        <Pressable onPress={addNotice} style={styles.button}>
          <Text style={styles.buttonText}>Add notice</Text>
        </Pressable>
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.featureLabel}>Pinned today</Text>
        <Text style={styles.featureText}>
          {featuredPinnedNotice ? featuredPinnedNotice.message : 'Pin a note to keep it close.'}
        </Text>
      </View>
    </WellnessBoardShell>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    marginBottom: 14,
  },
  notice: {
    backgroundColor: '#1a1d2a',
    borderWidth: 1,
    borderColor: '#2f3346',
    borderRadius: 14,
    padding: 12,
  },
  noticePinned: {
    borderColor: '#d8b9c8',
    backgroundColor: '#222536',
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  noticeTitle: {
    color: '#f4edf5',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  noticeState: {
    color: '#c5b7c9',
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  noticeText: {
    color: '#e4d7eb',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  form: {
    backgroundColor: '#1a1b26',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2f3346',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#121821',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#31384c',
    color: '#f5edf5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  textArea: {
    minHeight: 68,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#d5b0c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#181821',
    fontWeight: '700',
    fontSize: 14,
  },
  featureCard: {
    backgroundColor: '#2a2131',
    borderRadius: 14,
    padding: 12,
  },
  featureLabel: {
    color: '#f0c9d9',
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  featureText: {
    color: '#f5edf4',
    fontSize: 13,
    lineHeight: 18,
  },
})
