import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'
import { Mic, Square, X } from 'lucide-react-native'
import { useEffect } from 'react'
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ChatAttachment } from './chat-types'

import { useTheme } from '@/context/ThemeContext'

type Props = {
  visible: boolean
  onClose: () => void
  onRecord: (recording: { attachment: ChatAttachment; duration: number }) => Promise<void>
}

export function VoiceMessageRecorder({ visible, onClose, onRecord }: Props) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(recorder)
  const duration = Math.floor((recorderState.durationMillis ?? 0) / 1000)

  useEffect(
    () => () => {
      if (recorderState.isRecording) {
        void recorder.stop().catch(() => undefined)
      }
    },
    [recorder, recorderState.isRecording]
  )

  const start = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow microphone access to record a voice note.')
        return
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
    } catch (error) {
      Alert.alert(
        'Voice note failed',
        error instanceof Error ? error.message : 'Unable to start recording.'
      )
    }
  }

  const stop = async () => {
    try {
      await recorder.stop()
      const uri = recorder.uri
      if (!uri) throw new Error('The recording was not saved.')
      await onRecord({
        attachment: { uri, name: `voice-${Date.now()}.m4a`, mimeType: 'audio/m4a' },
        duration,
      })
      onClose()
    } catch (error) {
      Alert.alert(
        'Voice note failed',
        error instanceof Error ? error.message : 'Unable to send voice note.'
      )
    }
  }

  const isRecording = recorderState.isRecording

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice note</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textPrimary} size={22} />
            </TouchableOpacity>
          </View>
          <Text style={styles.timer}>
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </Text>
          <TouchableOpacity
            style={[styles.record, isRecording && styles.stop]}
            onPress={() => void (isRecording ? stop() : start())}
          >
            {isRecording ? (
              <Square color="#ffffff" size={30} />
            ) : (
              <Mic color={colors.accentForeground ?? '#ffffff'} size={30} />
            )}
          </TouchableOpacity>
          <Text style={styles.secondary}>{isRecording ? 'Tap to stop' : 'Tap to record'}</Text>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: colors.surface, borderRadius: 24, padding: 24, alignItems: 'center' },
    header: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
    timer: { color: colors.accent1, fontSize: 42, fontWeight: '700', marginVertical: 36 },
    record: { backgroundColor: colors.accent1, borderRadius: 42, padding: 24 },
    stop: { backgroundColor: colors.error },
    secondary: { color: colors.textSecondary, marginTop: 12 },
  })