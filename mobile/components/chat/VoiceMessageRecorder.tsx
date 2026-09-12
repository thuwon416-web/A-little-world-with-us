import { Audio } from 'expo-av'
import { Mic, Square, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatAttachment } from './chat-types'

type Props = {
  visible: boolean
  onClose: () => void
  onRecord: (recording: { attachment: ChatAttachment; duration: number }) => Promise<void>
}

export function VoiceMessageRecorder({ visible, onClose, onRecord }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(
    () => () => {
      if (recording) void recording.stopAndUnloadAsync()
    },
    [recording]
  )

  const start = async () => {
    const permission = await Audio.requestPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow microphone access to record a voice note.')
      return
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
    const result = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
    result.recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording) setDuration(Math.floor(status.durationMillis / 1000))
    })
    setRecording(result.recording)
    setDuration(0)
  }

  const stop = async () => {
    if (!recording) return
    setSaving(true)
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      if (!uri) throw new Error('The recording was not saved.')
      await onRecord({
        attachment: { uri, name: `voice-${Date.now()}.m4a`, mimeType: 'audio/m4a' },
        duration,
      })
      setRecording(null)
      setDuration(0)
      onClose()
    } catch (error) {
      Alert.alert(
        'Voice note failed',
        error instanceof Error ? error.message : 'Unable to send voice note.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice note</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#f3f0f5" size={22} />
            </TouchableOpacity>
          </View>
          <Text style={styles.timer}>
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={[styles.record, recording && styles.stop]}
            onPress={() => void (recording ? stop() : start())}
            disabled={saving}
          >
            {recording ? <Square color="#fff" size={30} /> : <Mic color="#fff" size={30} />}
          </TouchableOpacity>
          <Text style={styles.secondary}>{recording ? 'Tap to stop' : 'Tap to record'}</Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#171b22', borderRadius: 24, padding: 24, alignItems: 'center' },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#f3f0f5', fontSize: 20, fontWeight: '700' },
  timer: { color: '#b88ae5', fontSize: 42, fontWeight: '700', marginVertical: 36 },
  record: { backgroundColor: '#b88ae5', borderRadius: 42, padding: 24 },
  stop: { backgroundColor: '#d95d68' },
  secondary: { color: '#aaa7b2', marginTop: 12 },
})
