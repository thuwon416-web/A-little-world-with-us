import { useCallback, useEffect, useRef, useState } from 'react'
import {
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  type MediaStream,
} from 'react-native-webrtc'

import { useAuth } from '@/lib/auth'
import { getCallIceConfiguration } from '@/lib/callIce'
import {
  getCallIceCandidates,
  getCallSignal,
  endCall as endCallSignal,
  saveCallAnswer,
  saveCallIceCandidate,
  saveCallOffer,
  subscribeToCallIceCandidates,
  subscribeToCallSignals,
  type CallIceCandidateSignal,
  type CallSignal,
  type CallType,
} from '@/services/call'

export function usePeerCall(callId: string | null, callType: CallType, active: boolean) {
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraEnabled, setIsCameraEnabled] = useState(callType === 'video')
  const [connectionError, setConnectionError] = useState('')
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidates = useRef<CallIceCandidateSignal[]>([])
  const seenCandidates = useRef(new Set<string>())
  const offerStarted = useRef(false)
  const answerStarted = useRef(false)

  useEffect(() => {
    setIsCameraEnabled(callType === 'video')
  }, [callType])

  const stopMedia = useCallback(() => {
    peerRef.current?.close()
    peerRef.current = null
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
  }, [])

  const ensurePeer = useCallback(async () => {
    if (!callId || !user?.id) throw new Error('Call information is incomplete.')
    if (!peerRef.current) {
      const peer = new RTCPeerConnection(getCallIceConfiguration())
      peerRef.current = peer
      peer.addEventListener('track', (event) => {
        const stream = event.streams[0]
        if (stream) setRemoteStream(stream)
      })
      peer.addEventListener('icecandidate', (event) => {
        if (!event.candidate) return
        void saveCallIceCandidate(callId, event.candidate.toJSON()).then((saved) => {
          if (!saved) setConnectionError('Unable to send connection information.')
        })
      })
      peer.addEventListener('connectionstatechange', () => {
        if (peer.connectionState === 'failed') {
          setConnectionError('Connection failed. Check your internet connection.')
        }
      })
    }

    if (!localStreamRef.current) {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video' ? { facingMode: 'user' } : false,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
      stream.getTracks().forEach((track) => peerRef.current?.addTrack(track, stream))
    }
    return peerRef.current!
  }, [callId, callType, user?.id])

  const addRemoteCandidate = useCallback(
    async (row: CallIceCandidateSignal) => {
      if (!user?.id || row.sender_id === user.id || seenCandidates.current.has(row.id)) return
      seenCandidates.current.add(row.id)
      const peer = peerRef.current
      if (!peer?.remoteDescription) {
        pendingCandidates.current.push(row)
        return
      }
      try {
        await peer.addIceCandidate(new RTCIceCandidate(row.candidate))
      } catch {
        setConnectionError('Unable to read connection information.')
      }
    },
    [user?.id]
  )

  const flushCandidates = useCallback(async () => {
    const queued = pendingCandidates.current.splice(0)
    for (const candidate of queued) {
      seenCandidates.current.delete(candidate.id)
      await addRemoteCandidate(candidate)
    }
  }, [addRemoteCandidate])

  useEffect(() => {
    if (!callId || !active || !user?.id) return
    let mounted = true
    const processSignal = async (signal: CallSignal) => {
      if (
        !mounted ||
        signal.id !== callId ||
        signal.status === 'ended' ||
        signal.status === 'rejected'
      )
        return
      const isCaller = signal.caller_id === user.id

      try {
        const peer = await ensurePeer()
        if (isCaller && signal.answer && !peer.remoteDescription) {
          await peer.setRemoteDescription(signal.answer)
          await flushCandidates()
          return
        }

        if (isCaller && !signal.offer && !offerStarted.current) {
          offerStarted.current = true
          const offer = await peer.createOffer({})
          await peer.setLocalDescription(offer)
          const description = peer.localDescription?.toJSON()
          if (
            !description ||
            !(await saveCallOffer(callId, description as { type: 'offer'; sdp: string }))
          ) {
            throw new Error('Unable to send the call request.')
          }
          return
        }

        if (!isCaller && signal.status === 'in_call' && signal.offer && !answerStarted.current) {
          answerStarted.current = true
          await peer.setRemoteDescription(signal.offer)
          await flushCandidates()
          const answer = await peer.createAnswer()
          await peer.setLocalDescription(answer)
          const description = peer.localDescription?.toJSON()
          if (
            !description ||
            !(await saveCallAnswer(callId, description as { type: 'answer'; sdp: string }))
          ) {
            throw new Error('Unable to send the call answer.')
          }
        }
      } catch (error) {
        if (mounted) {
          setConnectionError(
            error instanceof Error
              ? error.message
              : 'Unable to start the call. Check microphone and camera permissions.'
          )
          offerStarted.current = false
          answerStarted.current = false
        }
      }
    }

    const callSubscription = subscribeToCallSignals((signal) => {
      if (signal.id === callId) void processSignal(signal)
    })
    const candidateSubscription = subscribeToCallIceCandidates(callId, (candidate) => {
      void addRemoteCandidate(candidate)
    })

    void Promise.all([getCallSignal(callId), getCallIceCandidates(callId)]).then(
      ([signal, candidates]) => {
        if (!mounted) return
        for (const candidate of candidates) void addRemoteCandidate(candidate)
        if (signal) void processSignal(signal)
      }
    )

    return () => {
      mounted = false
      callSubscription.unsubscribe()
      candidateSubscription.unsubscribe()
      void endCallSignal(callId)
      stopMedia()
      pendingCandidates.current = []
      seenCandidates.current.clear()
      offerStarted.current = false
      answerStarted.current = false
    }
  }, [active, addRemoteCandidate, callId, ensurePeer, flushCandidates, stopMedia, user?.id])

  const toggleMicrophone = useCallback(() => {
    const next = !isMuted
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next
    })
    setIsMuted(next)
  }, [isMuted])

  const toggleCamera = useCallback(() => {
    if (callType !== 'video') return
    const next = !isCameraEnabled
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next
    })
    setIsCameraEnabled(next)
  }, [callType, isCameraEnabled])

  return {
    localStream,
    remoteStream,
    isMuted,
    isCameraEnabled,
    connectionError,
    toggleMicrophone,
    toggleCamera,
  }
}
