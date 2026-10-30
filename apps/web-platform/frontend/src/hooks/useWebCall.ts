'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCallIceConfigurationAsync } from '@/lib/callIce'
import {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  saveCallOffer,
  saveCallAnswer,
  saveCallIceCandidate,
  subscribeToCallSignals,
  subscribeToCallIceCandidates,
  type CallSignal,
  type CallType,
  type CallStatus,
} from '@/services/call'

export function useWebCall() {
  const [userId, setUserId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState<string>('My Love')
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<CallSignal | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [callType, setCallType] = useState<CallType>('audio')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoDisabled, setIsVideoDisabled] = useState(false)
  const [duration, setDuration] = useState(0)

  const peerRef = useRef<RTCPeerConnection | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const offerHandledRef = useRef(false)

  // Initialize Auth & Partner
  useEffect(() => {
    let active = true
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (active) setUserId(user.id)

      const { data: link } = await supabase
        .from('couple_links')
        .select('couple_id, inviter_id, accepted_by')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()

      if (!link?.couple_id) return
      if (active) setCoupleId(link.couple_id)

      const pId = link.inviter_id === user.id ? link.accepted_by : link.inviter_id
      if (pId && active) {
        setPartnerId(pId)
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', pId).maybeSingle()
        if (prof?.full_name && active) setPartnerName(prof.full_name)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  // Call duration counter
  useEffect(() => {
    if (callStatus === 'in_call') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setDuration(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [callStatus])

  const cleanupPeer = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
      setLocalStream(null)
    }
    setRemoteStream(null)
    setActiveCall(null)
    setCallStatus('idle')
    offerHandledRef.current = false
  }, [localStream])

  // Subscribe to call signals
  useEffect(() => {
    if (!coupleId || !userId) return

    const unsubscribe = subscribeToCallSignals(coupleId, async (signal) => {
      if (signal.status === 'ended' || signal.status === 'rejected') {
        cleanupPeer()
        return
      }

      // Incoming call
      if (signal.receiver_id === userId && signal.status === 'calling') {
        setActiveCall(signal)
        setCallStatus('ringing')
        setCallType(signal.type)
      }

      // Call accepted by partner
      if (signal.caller_id === userId && signal.status === 'in_call' && peerRef.current) {
        setCallStatus('in_call')
        if (signal.answer && peerRef.current.signalingState === 'have-local-offer') {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal.answer))
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [coupleId, userId, cleanupPeer])

  // Setup Peer Connection
  const createPeerConnection = useCallback(async (cId: string, _currentCallType: CallType) => {
    const { data: { session } } = await supabase.auth.getSession()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const iceConfiguration = await getCallIceConfigurationAsync(session?.access_token, appUrl)
    const peer = new RTCPeerConnection(iceConfiguration)
    peerRef.current = peer

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void saveCallIceCandidate(cId, event.candidate.toJSON())
      }
    }

    peer.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      }
    }

    // Subscribe to ICE candidates from partner
    subscribeToCallIceCandidates(cId, (candidateSignal) => {
      if (candidateSignal.sender_id !== userId && peerRef.current) {
        void peerRef.current.addIceCandidate(new RTCIceCandidate(candidateSignal.candidate))
      }
    })

    return peer
  }, [userId])

  // Start an outgoing call
  const startCall = async (type: CallType) => {
    if (!partnerId || !coupleId) return
    try {
      setCallStatus('calling')
      setCallType(type)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      })
      setLocalStream(stream)

      const signal = await initiateCall(partnerId, type)
      if (!signal) {
        cleanupPeer()
        return
      }
      setActiveCall(signal)

      const peer = await createPeerConnection(signal.id, type)
      stream.getTracks().forEach((track) => peer.addTrack(track, stream))

      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      await saveCallOffer(signal.id, offer)
    } catch (err) {
      console.error('Failed to start call:', err)
      cleanupPeer()
    }
  }

  // Answer an incoming call
  const answerCall = async () => {
    if (!activeCall) return
    try {
      setCallStatus('in_call')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.type === 'video',
      })
      setLocalStream(stream)

      const peer = await createPeerConnection(activeCall.id, activeCall.type)
      stream.getTracks().forEach((track) => peer.addTrack(track, stream))

      if (activeCall.offer) {
        await peer.setRemoteDescription(new RTCSessionDescription(activeCall.offer))
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        await saveCallAnswer(activeCall.id, answer)
      }

      await acceptCall(activeCall.id)
    } catch (err) {
      console.error('Failed to answer call:', err)
      cleanupPeer()
    }
  }

  // Reject an incoming call
  const handleRejectCall = async () => {
    if (activeCall) {
      await rejectCall(activeCall.id)
    }
    cleanupPeer()
  }

  // End an ongoing call
  const handleEndCall = async () => {
    if (activeCall) {
      await endCall(activeCall.id)
    }
    cleanupPeer()
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted((prev) => !prev)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoDisabled((prev) => !prev)
    }
  }

  return {
    userId,
    partnerId,
    partnerName,
    callStatus,
    callType,
    localStream,
    remoteStream,
    isMuted,
    isVideoDisabled,
    duration,
    startCall,
    answerCall,
    rejectCall: handleRejectCall,
    endCall: handleEndCall,
    toggleMute,
    toggleVideo,
  }
}
