import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { RTCView, type MediaStream } from 'react-native-webrtc'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { useCall } from '@/hooks/useCall'
import { usePeerCall } from '@/hooks/usePeerCall'

export default function CallScreen() {
  const { colors } = useTheme()
  const { state, callType, endCall, attachCall, callId, callDuration } = useCall()
  const params = useLocalSearchParams<{ callId?: string; type?: string }>()
  const callIdParam = Array.isArray(params.callId) ? params.callId[0] : params.callId
  const peer = usePeerCall(callId, callType, state === 'calling' || state === 'in_call')

  useEffect(() => {
    const type = Array.isArray(params.type) ? params.type[0] : params.type
    if (callIdParam) void attachCall(callIdParam, type === 'video' ? 'video' : 'audio')
  }, [attachCall, callIdParam, params.type])

  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const toggleMicrophone = useCallback(() => peer.toggleMicrophone(), [peer.toggleMicrophone])
  const toggleCamera = useCallback(() => peer.toggleCamera(), [peer.toggleCamera])
  const clock = `${Math.floor(callDuration / 60)
    .toString()
    .padStart(2, '0')}:${(callDuration % 60).toString().padStart(2, '0')}`
  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {state === 'calling'
          ? 'ခေါ်ဆိုရန် တောင်းဆိုနေသည်…'
          : state === 'ringing'
            ? 'ခေါ်ဆိုမှု ဝင်လာသည်'
            : state === 'in_call'
              ? 'ခေါ်ဆိုမှု ချိတ်ဆက်နေသည်'
              : state === 'ended'
                ? 'ခေါ်ဆိုမှု ပြီးဆုံးပါပြီ'
                : state === 'rejected'
                  ? 'ခေါ်ဆိုမှုကို ငြင်းပယ်လိုက်သည်'
                  : 'ခေါ်ဆိုမှု'}
      </Text>
      <View style={styles.stage}>
        {callType === 'video' && peer.remoteStream ? (
          <RTCView
            streamURL={streamUrl(peer.remoteStream)}
            objectFit="cover"
            style={styles.remoteVideo}
          />
        ) : callType === 'video' && peer.localStream ? (
          <RTCView
            streamURL={streamUrl(peer.localStream)}
            objectFit="cover"
            mirror
            style={styles.remoteVideo}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>
              {peer.remoteStream ? 'အသံချိတ်ဆက်ပြီးပါပြီ' : 'တွဲဖက်ကို ချိတ်ဆက်နေသည်…'}
            </Text>
            {state === 'in_call' && <Text style={styles.timer}>{clock}</Text>}
          </View>
        )}
        {callType === 'video' && peer.remoteStream && peer.localStream && (
          <RTCView
            streamURL={streamUrl(peer.localStream)}
            objectFit="cover"
            mirror
            style={styles.localVideo}
          />
        )}
        {peer.connectionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {peer.connectionError}
          </Text>
        ) : null}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleMicrophone}>
          <Text style={styles.controlText}>{peer.isMuted ? 'အသံဖွင့်ရန်' : 'အသံပိတ်ရန်'}</Text>
        </TouchableOpacity>
        {callType === 'video' && (
          <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
            <Text style={styles.controlText}>
              {peer.isCameraEnabled ? 'ကင်မရာပိတ်ရန်' : 'ကင်မရာဖွင့်ရန်'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.controlButton, styles.endButton]} onPress={endCall}>
          <Text style={styles.controlText}>ခေါ်ဆိုမှုကို အဆုံးသတ်ရန်</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 72,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    status: {
      color: colors.textPrimary,
      fontSize: sizes.text.hMd,
      fontWeight: '700',
      marginBottom: 8,
    },
    stage: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      overflow: 'hidden',
      minHeight: 180,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      justifyContent: 'center',
    },
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    placeholderTitle: {
      color: colors.textPrimary,
      fontSize: sizes.text.hSm,
      fontWeight: '700',
    },
    placeholderSubtitle: {
      color: colors.textSecondary,
      marginTop: 8,
    },
    remoteVideo: { ...StyleSheet.absoluteFillObject },
    localVideo: {
      position: 'absolute',
      right: 12,
      top: 12,
      width: 112,
      height: 160,
      borderRadius: 16,
      overflow: 'hidden',
    },
    timer: { color: colors.textSecondary, marginTop: 14, fontVariant: ['tabular-nums'] },
    error: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 12,
      color: colors.error,
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 12,
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
      borderRadius: sizes.radius.input,
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

function streamUrl(stream: MediaStream) {
  return stream.toURL()
}
