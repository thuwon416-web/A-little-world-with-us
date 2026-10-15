import { supabase } from '@/lib/supabase'

export type CallType = 'audio' | 'video'
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended' | 'rejected'

export type CallSignal = {
  id: string
  couple_id: string
  caller_id: string
  receiver_id: string
  type: CallType
  status: CallStatus
  offer?: RTCSessionDescriptionInit | null
  answer?: RTCSessionDescriptionInit | null
  created_at: string
  updated_at?: string
}

export type CallIceCandidateSignal = {
  id: string
  call_id: string
  sender_id: string
  candidate: RTCIceCandidateInit
}

export async function initiateCall(receiverId: string, type: CallType): Promise<CallSignal | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: link } = await supabase
    .from('couple_links')
    .select('couple_id, inviter_id, accepted_by')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!link?.couple_id || receiverId === user.id) return null

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

export async function acceptCall(callId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('call_signals')
    .update({ status: 'in_call', updated_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('receiver_id', user.id)
    .select('id')
    .maybeSingle()

  return !error && Boolean(data)
}

export async function rejectCall(callId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from('call_signals')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', callId)
    .eq('receiver_id', user.id)
    .select('id')
    .maybeSingle()

  return !error && Boolean(data)
}

export async function endCall(callId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('call_signals')
    .update({ status: 'ended', updated_at: new Date().toISOString() })
    .eq('id', callId)
    .select('id')
    .maybeSingle()

  return !error && Boolean(data)
}

export async function saveCallOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<boolean> {
  const { error } = await supabase
    .from('call_signals')
    .update({ offer, updated_at: new Date().toISOString() })
    .eq('id', callId)

  return !error
}

export async function saveCallAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<boolean> {
  const { error } = await supabase
    .from('call_signals')
    .update({ answer, updated_at: new Date().toISOString() })
    .eq('id', callId)

  return !error
}

export async function saveCallIceCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase.from('call_ice_candidates').insert({
    call_id: callId,
    sender_id: user.id,
    candidate,
  })

  return !error
}

export function subscribeToCallSignals(coupleId: string, onSignal: (signal: CallSignal) => void) {
  const channel = supabase
    .channel(`call-signals-${coupleId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'call_signals', filter: `couple_id=eq.${coupleId}` },
      (payload) => {
        onSignal(payload.new as CallSignal)
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToCallIceCandidates(callId: string, onCandidate: (candidate: CallIceCandidateSignal) => void) {
  const channel = supabase
    .channel(`call-ice-${callId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'call_ice_candidates', filter: `call_id=eq.${callId}` },
      (payload) => {
        onCandidate(payload.new as CallIceCandidateSignal)
      }
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
