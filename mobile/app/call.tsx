import { CameraView, useCameraPermissions } from 'expo-camera'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCall } from '@/hooks/useCall'

function formatCallDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function CallScreen() {
  const { state, callType, callDuration, isMuted, cameraFacing, endCall, toggleMute, toggleCamera } = useCall()
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

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{state === 'calling' ? 'Calling...' : state === 'in_call' ? 'In call' : state === 'ended' ? 'Call ended' : 'Call'}</Text>
      <Text style={styles.time}>{formatCallDuration(callDuration)}</Text>

      {callType === 'video' && showLocalCamera ? (
        <CameraView style={styles.camera} facing={cameraFacing} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>{callType === 'video' ? 'Video call' : 'Audio call'}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  status: {
    color: '#f3f0f5',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  time: {
    color: '#d9bfd7',
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
    backgroundColor: '#171b22',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 240,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  placeholderTitle: {
    color: '#f3f0f5',
    fontSize: 22,
    fontWeight: '700',
  },
  placeholderSubtitle: {
    color: '#c4c4ce',
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
    backgroundColor: '#171b22',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  endButton: {
    backgroundColor: '#d9534f',
  },
  controlText: {
    color: '#f3f0f5',
    fontWeight: '700',
  },
})
