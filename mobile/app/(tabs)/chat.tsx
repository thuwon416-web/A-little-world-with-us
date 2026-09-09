import { Q } from '@nozbe/watermelondb'
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Button } from '@/components/Button'
import { ChatBubble } from '@/components/ChatBubble'
import { Input } from '@/components/Input'
import { database } from '@/database'
import { useCall } from '@/hooks/useCall'
import { useSync } from '@/hooks/useSync'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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
  const { user } = useAuth()
  const { status, isOffline, pendingCount, refresh } = useSync()
  const { state: callState, placeCall } = useCall()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<
    {
      id: string
      sender: 'me' | 'them'
      text: string
      time: string
      type: 'text' | 'location' | 'sos'
      location: { latitude: number; longitude: number; accuracy?: number } | null
    }[]
  >([])
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)

  useEffect(() => {
    const subscription = database
      .get('messages')
      .query(Q.sortBy('created_at', 'asc'))
      .observe()
      .subscribe((records) => {
        setMessages(
          records.map((record) => {
            const rawRecord = record as unknown as { id: string; _get: (column: string) => unknown }
            const serializedLocation = rawRecord._get('location_payload')
            let location: { latitude: number; longitude: number; accuracy?: number } | null = null
            if (typeof serializedLocation === 'string' && serializedLocation) {
              try {
                location = JSON.parse(serializedLocation) as {
                  latitude: number
                  longitude: number
                  accuracy?: number
                }
              } catch {
                location = null
              }
            }
            const content = rawRecord._get('content')
            const createdAt = rawRecord._get('created_at')
            const messageType = rawRecord._get('message_type')
            return {
              id: rawRecord.id,
              sender: rawRecord._get('sender_id') === user?.id ? 'me' : 'them',
              text: typeof content === 'string' ? content : '',
              time: formatMessageTime(
                typeof createdAt === 'string' ? createdAt : new Date().toISOString()
              ),
              type: messageType === 'location' || messageType === 'sos' ? messageType : 'text',
              location,
            }
          })
        )
      })

    return () => subscription.unsubscribe()
  }, [user?.id])

  // Fetch the accepted couple link and resolve the partner from its members.
  useEffect(() => {
    const fetchPartnerId = async () => {
      if (!user?.id) return

      try {
        const { data } = await supabase
          .from('couple_links')
          .select('couple_id, inviter_id, accepted_by')
          .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
          .eq('status', 'accepted')
          .single()

        if (data?.couple_id && data.accepted_by) {
          setCoupleId(data.couple_id)
          setPartnerId(data.inviter_id === user.id ? data.accepted_by : data.inviter_id)
        }
      } catch (error) {
        console.error('Error fetching partner ID:', error)
      }
    }

    fetchPartnerId()
  }, [user?.id])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || !user?.id || !coupleId) return

    const createdAt = new Date().toISOString()

    await database.write(async () => {
      await database.get('messages').create((record) => {
        const rawRecord = record as unknown as {
          content: string
          sender_id: string
          couple_id: string
          created_at: string
          synced: boolean
        }
        rawRecord.content = trimmed
        rawRecord.sender_id = user.id
        rawRecord.couple_id = coupleId
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

  const handleSendLocation = async () => {
    if (!user?.id || !coupleId) return
    const { status: permission } = await Location.requestForegroundPermissionsAsync()
    if (permission !== 'granted') {
      Alert.alert(
        'Location permission needed',
        'Allow location access to send your current map pin.'
      )
      return
    }
    try {
      const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const payload = {
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
        accuracy: point.coords.accuracy ?? undefined,
      }
      await database.write(async () => {
        await database.get('messages').create((record) => {
          const rawRecord = record as unknown as {
            content: string
            sender_id: string
            couple_id: string
            created_at: string
            synced: boolean
            message_type: string
            location_payload: string
          }
          rawRecord.content = 'Shared a location'
          rawRecord.sender_id = user.id
          rawRecord.couple_id = coupleId
          rawRecord.created_at = new Date().toISOString()
          rawRecord.message_type = 'location'
          rawRecord.location_payload = JSON.stringify(payload)
          rawRecord.synced = !isOffline
        })
      })
      if (!isOffline) await refresh()
    } catch {
      Alert.alert('Could not get location', 'Check GPS and try again.')
    }
  }

  const handleCall = (type: 'audio' | 'video') => {
    if (!partnerId) {
      console.error('Partner ID not found')
      return
    }
    void placeCall(partnerId, type)
  }

  const statusLabel = isOffline
    ? 'Offline'
    : status === 'syncing'
      ? 'Syncing...'
      : status === 'error'
        ? 'Sync error'
        : 'Synced'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whispers</Text>

      <View style={[styles.syncBanner, isOffline ? styles.offline : styles.online]}>
        <Text style={styles.syncText}>{statusLabel}</Text>
        {pendingCount > 0 && <Text style={styles.syncText}>• {pendingCount} pending</Text>}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        numColumns={1}
      />

      <View style={styles.callRow}>
        <TouchableOpacity
          style={[styles.callButton, !partnerId && styles.callButtonDisabled]}
          onPress={() => handleCall('audio')}
          disabled={!partnerId}
        >
          <Text style={styles.callButtonText}>Audio call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButtonVideo, !partnerId && styles.callButtonDisabled]}
          onPress={() => handleCall('video')}
          disabled={!partnerId}
        >
          <Text style={styles.callButtonText}>Video call</Text>
        </TouchableOpacity>
      </View>

      {callState !== 'idle' && <Text style={styles.callStatus}>Call status: {callState}</Text>}

      <View style={styles.composer}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => void handleSendLocation()}
          disabled={!coupleId}
          accessibilityLabel="Send current location"
        >
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
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
  callButtonDisabled: {
    opacity: 0.5,
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
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2d2f43',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: { fontSize: 19 },
  input: {
    flex: 1,
  },
})
