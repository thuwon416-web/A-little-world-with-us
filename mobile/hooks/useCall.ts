import { useCallback, useEffect, useMemo, useState } from 'react'
import { Audio } from 'expo-av'
import { Camera, CameraType } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { acceptCall, endCall, initiateCall, rejectCall, subscribeToCallSignals, type CallSignal, type CallType } from '@/services/call'

export type CallState = 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended' | 'rejected'

export function useCall() {
  const router = useRouter()
  const { user } = useAuth()
  const [state, setState] = useState<CallState>('idle')
  const [callType, setCallType] = useState<CallType>('audio')
  const [callId, setCallId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front')

  useEffect(() => {
    if (state !== 'in_call') {
      return
    }

    const timer = setInterval(() => {
      setCallDuration((current) => current + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [state])

  useEffect(() => {
    const { unsubscribe } = subscribeToCallSignals((signal: CallSignal) => {
      if (signal.receiver_id !== user?.id) {
        return
      }

      if (signal.status === 'calling') {
        setState('ringing')
        setCallId(signal.id)
        setCallType(signal.type)
      }
    })

    return () => unsubscribe()
  }, [user?.id])

  const requestPermissions = useCallback(async (type: CallType) => {
    if (type === 'video') {
      const { status } = await Camera.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Camera permission denied')
      }
    }

    const { status } = await Audio.requestPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Microphone permission denied')
    }
  }, [])

  const placeCall = useCallback(
    async (receiverId: string, type: CallType) => {
      try {
        await requestPermissions(type)
        const result = await initiateCall(receiverId, type)
        if (!result) {
          setError('Unable to start call')
          return
        }

        setState('calling')
        setCallType(type)
        setCallId(result.id)
        setCallDuration(0)
        router.push('/call')
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to start call')
      }
    },
    [requestPermissions, router],
  )

  const handleAccept = useCallback(async () => {
    if (!callId) {
      return
    }

    try {
      await requestPermissions(callType)
      const accepted = await acceptCall(callId)
      if (accepted) {
        setState('in_call')
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to accept call')
    }
  }, [callId, callType, requestPermissions])

  const handleReject = useCallback(async () => {
    if (!callId) {
      setState('ended')
      return
    }

    await rejectCall(callId)
    setState('rejected')
  }, [callId])

  const handleEnd = useCallback(async () => {
    if (callId) {
      await endCall(callId)
    }
    setState('ended')
    setCallDuration(0)
  }, [callId])

  const toggleMute = useCallback(() => {
    setIsMuted((current) => !current)
  }, [])

  const toggleCamera = useCallback(() => {
    setCameraFacing((current) => (current === 'front' ? 'back' : 'front'))
  }, [])

  return useMemo(
    () => ({
      state,
      callType,
      callId,
      error,
      callDuration,
      isMuted,
      cameraFacing,
      placeCall,
      acceptCall: handleAccept,
      rejectCall: handleReject,
      endCall: handleEnd,
      toggleMute,
      toggleCamera,
    }),
    [callDuration, callId, callType, error, handleAccept, handleEnd, handleReject, isMuted, placeCall, state, toggleCamera, toggleMute, cameraFacing],
  )
}
