import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type CallType = 'audio' | 'video'
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended' | 'rejected'

export type CallSignal = {
  id: string
  caller_id: string
  receiver_id: string
  type: CallType
  status: CallStatus
  created_at: string
  updated_at?: string
}

const channelName = 'call-signals'

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

  const payload = {
    id: crypto.randomUUID(),
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
  const { error } = await supabase
    .from('call_signals')
    .update({ status: 'in_call', updated_at: new Date().toISOString() })
    .eq('id', callId)

  return !error
}

export async function rejectCall(callId: string) {
  const { error } = await supabase
    .from('call_signals')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', callId)

  return !error
}

export async function endCall(callId: string) {
  const { error } = await supabase
    .from('call_signals')
    .update({ status: 'ended', updated_at: new Date().toISOString() })
    .eq('id', callId)

  return !error
}

export function subscribeToCallSignals(onSignal: (signal: CallSignal) => void) {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => undefined }
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'call_signals' },
      (payload) => {
        const signal = payload.new as CallSignal
        onSignal(signal)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
