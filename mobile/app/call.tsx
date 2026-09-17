import { CameraView, useCameraPermissions } from 'expo-camera'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { useCall } from '@/hooks/useCall'

function formatCallDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function CallScreen() {
  const { colors } = useTheme()
  const {
    state,
    callType,
    callDuration,
    isMuted,
    cameraFacing,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall()
  const [permission, requestPermission] = useCameraPermissions()
  const [showLocalCamera, setShowLocalCamera] = useState(callType === 'video')

  useEffect(() => {
    setShowLocalCamera(callType === 'video' && state === 'in_call')
  }, [callType, state])

  useEffect(() => {
    if (callType === 'video' && !permission?.granted) {
      void requestPermission()
    }
  }, [callType, permission, requestPermission])

  const styles = createStyles(colors)
  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {state === 'calling'
          ? 'Calling...'
          : state === 'in_call'
            ? 'In call'
            : state === 'ended'
              ? 'Call ended'
              : 'Call'}
      </Text>
      <Text style={styles.time}>{formatCallDuration(callDuration)}</Text>

      {callType === 'video' && showLocalCamera ? (
        <CameraView style={styles.camera} facing={cameraFacing} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>
            {callType === 'video' ? 'Video call' : 'Audio call'}
          </Text>
          <Text style={styles.placeholderSubtitle}>Connection quality: strong</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
          <Text style={styles.controlText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
        </TouchableOpacity>

        {callType === 'video' ? (
          <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
            <Text style={styles.controlText}>Flip camera</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={[styles.controlButton, styles.endButton]} onPress={endCall}>
          <Text style={styles.controlText}>End</Text>
        </TouchableOpacity>
      </View>
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
  status: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  time: {
    color: colors.accent2,
    fontSize: 18,
    marginBottom: 18,
  },
  camera: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    minHeight: 240,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 240,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  placeholderTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  placeholderSubtitle: {
    color: colors.textSecondary,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },
  controlButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  endButton: {
    backgroundColor: colors.error,
  },
  controlText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
})
