import * as Crypto from 'expo-crypto'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type CallType = 'audio' | 'video'
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended' | 'rejected'

export type CallSignal = {
  id: string
  caller_id: string
  receiver_id: string
  type: CallType
  status: CallStatus
  offer?: CallDescription | null
  answer?: CallDescription | null
  created_at: string
  updated_at?: string
}

export type CallDescription = { type: 'offer' | 'answer'; sdp: string }
export type CallIceCandidate = {
  candidate: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
}
export type CallIceCandidateSignal = {
  id: string
  call_id: string
  sender_id: string
  candidate: CallIceCandidate
}

const CHANNEL_PREFIX = 'call-signals'

export async function initiateCall(receiverId: string, type: CallType) {
  if (!isSupabaseConfigured) {
    return null
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: link, error: linkError } = await supabase
    .from('couple_links')
    .select('couple_id,inviter_id,accepted_by')
    .eq('status', 'accepted')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .maybeSingle()
  if (
    linkError ||
    !link?.couple_id ||
    receiverId === user.id ||
    ![link.inviter_id, link.accepted_by].includes(receiverId)
  ) {
    return null
  }

  const payload = {
    id: crypto.randomUUID(),
    couple_id: link.couple_id,
    caller_id: user.id,
    receiver_id: receiverId,
    type,
    status: 'calling',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('call_signals').insert(payload).select().single()
  return error ? null : (data as CallSignal | null)
}

export async function acceptCall(callId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const { data, error } = await supabase
    .from('call_signals')
    .update({ status: 'in_call', updated_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('receiver_id', user.id)
    .eq('status', 'calling')
    .select('id')
    .maybeSingle()

  return !error && Boolean(data)
}

export async function rejectCall(callId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const { data, error } = await supabase
    .from('call_signals')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('receiver_id', user.id)
    .eq('status', 'calling')
    .select('id')
    .maybeSingle()

  return !error && Boolean(data)
}

export async function endCall(callId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const { data, error } = await supabase
    .from('call_signals')
    .update({ status: 'ended', updated_at: new Date().toISOString() })
    .eq('id', callId)
    .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .in('status', ['calling', 'in_call'])
    .select('id')
    .maybeSingle()

  return !error && Boolean(data)
}

export async function getCallSignal(callId: string) {
  const { data, error } = await supabase
    .from('call_signals')
    .select('id,caller_id,receiver_id,type,status,created_at,updated_at,offer,answer')
    .eq('id', callId)
    .maybeSingle()
  return error ? null : (data as CallSignal | null)
}

export async function saveCallOffer(callId: string, offer: CallDescription) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const { data, error } = await supabase
    .from('call_signals')
    .update({ offer, updated_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('caller_id', user.id)
    .in('status', ['calling', 'in_call'])
    .select('id')
    .maybeSingle()
  return !error && Boolean(data)
}

export async function saveCallAnswer(callId: string, answer: CallDescription) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const { data, error } = await supabase
    .from('call_signals')
    .update({ answer, updated_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('receiver_id', user.id)
    .eq('status', 'in_call')
    .select('id')
    .maybeSingle()
  return !error && Boolean(data)
}

export async function saveCallIceCandidate(callId: string, candidate: CallIceCandidate) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return false
  const { error } = await supabase.from('call_ice_candidates').insert({
    call_id: callId,
    sender_id: user.id,
    candidate,
  })
  return !error
}

export async function getCallIceCandidates(callId: string) {
  const { data, error } = await supabase
    .from('call_ice_candidates')
    .select('id,call_id,sender_id,candidate')
    .eq('call_id', callId)
    .order('created_at', { ascending: true })
  return error ? [] : (data as CallIceCandidateSignal[])
}

export function subscribeToCallIceCandidates(
  callId: string,
  onCandidate: (candidate: CallIceCandidateSignal) => void
) {
  const channel = supabase
    .channel(`${CHANNEL_PREFIX}-ice-${callId}-${Crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'call_ice_candidates',
        filter: `call_id=eq.${callId}`,
      },
      (payload) => onCandidate(payload.new as CallIceCandidateSignal)
    )
    .subscribe()

  return { unsubscribe: () => void supabase.removeChannel(channel) }
}

export function subscribeToCallSignals(onSignal: (signal: CallSignal) => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined }
  }

  const uniqueChannelName = `${CHANNEL_PREFIX}-${Date.now()}-${Crypto.randomUUID()}`
  const channel = supabase
    .channel(uniqueChannelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'call_signals' }, (payload) => {
      const signal = payload.new as CallSignal
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && (signal.caller_id === user.id || signal.receiver_id === user.id))
          onSignal(signal)
      })
    })
    .subscribe()

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
