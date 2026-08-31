import { Audio } from 'expo-av'
import { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { type CallSignal } from '@/services/call'

export function IncomingCall({
  visible,
  signal,
  onAccept,
  onReject,
}: {
  visible: boolean
  signal: CallSignal | null
  onAccept: () => void
  onReject: () => void
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  useEffect(() => {
    if (!visible) {
      void sound?.stopAsync()
      return
    }

    const loadTone = async () => {
      try {
        const ringtone = new Audio.Sound()
        await ringtone.loadAsync({ uri: 'https://example.com/ring.mp3' })
        await ringtone.playAsync()
        setSound(ringtone)
      } catch {
        // Silent fallback for environments without a bundled ring tone.
      }
    }

    void loadTone()

    return () => {
      void sound?.stopAsync()
      void sound?.unloadAsync()
    }
  }, [visible])

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Incoming call</Text>
          <Text style={styles.subtitle}>
            {signal?.type === 'video' ? 'Video call' : 'Audio call'}
          </Text>
          <Text style={styles.caller}>{signal?.caller_id ?? 'Partner'}</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.rejectButton]} onPress={onReject}>
              <Text style={styles.buttonText}>Reject</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 24,
    width: '84%',
    padding: 24,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  title: {
    color: '#f3f0f5',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#d9bfd7',
    fontSize: 14,
    marginBottom: 12,
  },
  caller: {
    color: '#f3f0f5',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#2f8f66',
  },
  rejectButton: {
    backgroundColor: '#d9534f',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
})
