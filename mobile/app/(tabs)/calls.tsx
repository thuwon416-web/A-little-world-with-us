import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { IncomingCall } from '@/components/IncomingCall'
import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { useCall } from '@/hooks/useCall'
import { getCalls, getContext } from '@/services/secondary'

type CallLog = {
  id: string
  call_type: 'audio' | 'video'
  duration_seconds: number | null
  created_at: string
}

export default function CallsScreen() {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [error, setError] = useState('')
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const { placeCall, state, incomingSignal, acceptCall, rejectCall } = useCall()
  useEffect(() => {
    void (async () => {
      try {
        const context = await getContext()
        if (context.link)
          setPartnerId(
            context.link.inviter_id === context.user.id
              ? context.link.accepted_by
              : context.link.inviter_id
          )
        if (context.coupleId) setCalls(await getCalls(context.coupleId))
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load call history.')
      }
    })()
  }, [])
  const callAgain = async (type: 'audio' | 'video') => {
    if (!partnerId) {
      Alert.alert('Unable to call', 'Connect a partner account first.')
      return
    }
    await placeCall(partnerId, type)
  }
  return (
    <SecondaryPage title="Calls">
      <IncomingCall
        visible={state === 'ringing' && Boolean(incomingSignal)}
        signal={incomingSignal}
        onAccept={() => void acceptCall()}
        onReject={() => void rejectCall()}
      />
      <Text style={s.muted}>Call history</Text>
      {error ? <Text style={s.danger}>{error}</Text> : null}
      {calls.length ? (
        calls.map((call) => (
          <View key={call.id} style={s.card}>
            <Text style={s.buttonText}>
              {call.call_type === 'video' ? 'Video call' : 'Audio call'}
            </Text>
            <Text style={s.muted}>
              {Math.floor((call.duration_seconds ?? 0) / 60)} min ·{' '}
              {new Date(call.created_at).toLocaleString()}
            </Text>
            <TouchableOpacity
              style={s.button}
              onPress={() => void callAgain(call.call_type === 'video' ? 'video' : 'audio')}
            >
              <Text style={s.buttonText}>Call again</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={s.muted}>No call history yet.</Text>
      )}
    </SecondaryPage>
  )
}
