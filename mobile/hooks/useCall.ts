import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/lib/auth'
import {
  acceptCall,
  endCall,
  getCallSignal,
  initiateCall,
  rejectCall,
  subscribeToCallSignals,
  type CallSignal,
  type CallType,
} from '@/services/call'

export type CallState = 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended' | 'rejected'

export function useCall() {
  const router = useRouter()
  const { user } = useAuth()
  const [state, setState] = useState<CallState>('idle')
  const [callType, setCallType] = useState<CallType>('audio')
  const [callId, setCallId] = useState<string | null>(null)
  const callIdRef = useRef<string | null>(null)
  const [incomingSignal, setIncomingSignal] = useState<CallSignal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)

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
      if (signal.receiver_id === user?.id && signal.status === 'calling') {
        callIdRef.current = signal.id
        setState('ringing')
        setCallId(signal.id)
        setCallType(signal.type)
        setIncomingSignal(signal)
        return
      }

      if (signal.id !== callIdRef.current) return
      if (signal.status === 'in_call') {
        setState('in_call')
        setIncomingSignal(null)
      } else if (signal.status === 'ended') {
        setState('ended')
        setIncomingSignal(null)
      } else if (signal.status === 'rejected') {
        setState('rejected')
        setIncomingSignal(null)
      }
    })

    return () => unsubscribe()
  }, [user?.id])

  const placeCall = useCallback(
    async (receiverId: string, type: CallType) => {
      try {
        const result = await initiateCall(receiverId, type)
        if (!result) {
          setError('Unable to start call')
          return
        }

        setState('calling')
        setCallType(type)
        setCallId(result.id)
        callIdRef.current = result.id
        setCallDuration(0)
        router.push({ pathname: '/call', params: { callId: result.id, type } })
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to start call')
      }
    },
    [router]
  )

  const handleAccept = useCallback(async () => {
    if (!callId) {
      return
    }

    try {
      const accepted = await acceptCall(callId)
      if (accepted) {
        setState('in_call')
        setIncomingSignal(null)
        router.push({ pathname: '/call', params: { callId, type: callType } })
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to accept call')
    }
  }, [callId, callType, router])

  const handleReject = useCallback(async () => {
    if (!callId) {
      setState('ended')
      return
    }

    const rejected = await rejectCall(callId)
    setState(rejected ? 'rejected' : 'ringing')
    if (rejected) setIncomingSignal(null)
  }, [callId])

  const handleEnd = useCallback(async () => {
    if (callId) {
      await endCall(callId)
    }
    setState('ended')
    setCallDuration(0)
    setIncomingSignal(null)
    callIdRef.current = null
  }, [callId])

  const attachCall = useCallback(async (id: string, type: CallType) => {
    callIdRef.current = id
    setCallId(id)
    setCallType(type)
    const signal = await getCallSignal(id)
    if (signal) {
      callIdRef.current = signal.id
      setState(
        signal.status === 'in_call'
          ? 'in_call'
          : signal.status === 'calling'
            ? 'calling'
            : signal.status === 'rejected'
              ? 'rejected'
              : 'ended'
      )
      setCallDuration(0)
    }
  }, [])

  return useMemo(
    () => ({
      state,
      callType,
      callId,
      incomingSignal,
      attachCall,
      error,
      callDuration,
      placeCall,
      acceptCall: handleAccept,
      rejectCall: handleReject,
      endCall: handleEnd,
    }),
    [
      callDuration,
      callId,
      incomingSignal,
      attachCall,
      callType,
      error,
      handleAccept,
      handleEnd,
      handleReject,
      placeCall,
      state,
    ]
  )
}
