import { Q } from '@nozbe/watermelondb'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChatBubble } from '@/components/ChatBubble'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { database } from '@/database'
import { useAuth } from '@/lib/auth'
import { useCall } from '@/hooks/useCall'
import { useSync } from '@/hooks/useSync'

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Now'
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { status, isOffline, pendingCount, refresh } = useSync()
  const { state: callState, placeCall } = useCall()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const subscription = database
      .get('messages')
      .query(Q.sortBy('created_at', 'asc'))
      .observe()
      .subscribe((records) => {
        setMessages(
          records.map((record) => {
            const rawRecord = record as any
            return {
              id: rawRecord.id,
              sender: rawRecord._get('sender_id') === user?.id ? 'me' : 'them',
              text: rawRecord._get('content') ?? '',
              time: formatMessageTime(rawRecord._get('created_at') ?? new Date().toISOString()),
            }
          }),
        )
      })

    return () => subscription.unsubscribe()
  }, [user?.id])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed) return

    const createdAt = new Date().toISOString()

    await database.write(async () => {
      await database.get('messages').create((record) => {
        const rawRecord = record as any
        rawRecord.content = trimmed
        rawRecord.sender_id = user?.id ?? 'local-user'
        rawRecord.created_at = createdAt
        rawRecord.synced = !isOffline
      })
    })

    setDraft('')

    if (isOffline) {
      return
    }

    await refresh()
  }

  const statusLabel = isOffline ? 'Offline' : status === 'syncing' ? 'Syncing...' : status === 'error' ? 'Sync error' : 'Synced'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whispers</Text>

      <View style={[styles.syncBanner, isOffline ? styles.offline : styles.online]}>
        <Text style={styles.syncText}>{statusLabel}</Text>
        {pendingCount > 0 && <Text style={styles.syncText}>• {pendingCount} pending</Text>}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      <View style={styles.callRow}>
        <TouchableOpacity style={styles.callButton} onPress={() => void placeCall('partner-user-id', 'audio')}>
          <Text style={styles.callButtonText}>Audio call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButtonVideo} onPress={() => void placeCall('partner-user-id', 'video')}>
          <Text style={styles.callButtonText}>Video call</Text>
        </TouchableOpacity>
      </View>

      {callState !== 'idle' && <Text style={styles.callStatus}>Call status: {callState}</Text>}

      <View style={styles.composer}>
        <Input
          value={draft}
          onChangeText={setDraft}
          placeholder="Write something sweet..."
          style={styles.input}
        />
        <Button title="Send" onPress={() => void handleSend()} />
      </View>
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
    marginBottom: 12,
  },
  syncBanner: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  online: {
    backgroundColor: '#1b2d25',
  },
  offline: {
    backgroundColor: '#2f1f22',
  },
  syncText: {
    color: '#f3f0f5',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    backgroundColor: '#11161d',
    borderRadius: 20,
    padding: 16,
  },
  listContent: {
    gap: 12,
  },
  callRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#1b2d25',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callButtonVideo: {
    flex: 1,
    backgroundColor: '#2d2f43',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#f3f0f5',
    fontWeight: '700',
  },
  callStatus: {
    color: '#d9bfd7',
    fontSize: 12,
    marginBottom: 10,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  input: {
    flex: 1,
  },
})
