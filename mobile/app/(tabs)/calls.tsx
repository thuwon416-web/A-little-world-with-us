import { useEffect, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { getCalls, getContext } from '@/services/secondary'
export default function CallsScreen() {
  const [calls, setCalls] = useState<any[]>([]); const [error, setError] = useState('')
  useEffect(() => { void (async () => { try { const context = await getContext(); if (context.coupleId) setCalls(await getCalls(context.coupleId)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load calls.') } })() }, [])
  return <SecondaryPage title="Call History"><Text style={s.muted}>Your audio and video calls together.</Text>{error ? <Text style={s.danger}>{error}</Text> : null}{calls.length ? calls.map((call) => <View key={call.id} style={s.card}><Text style={s.buttonText}>{call.call_type === 'video' ? 'Video call' : 'Audio call'}</Text><Text style={s.muted}>{Math.floor((call.duration_seconds ?? 0) / 60)} min · {new Date(call.created_at).toLocaleString()}</Text><TouchableOpacity style={s.button} onPress={() => Alert.alert('Calling', 'Open Chat to start a new call with your partner.')}><Text style={s.buttonText}>Call again</Text></TouchableOpacity></View>) : <Text style={s.muted}>No calls have been recorded yet.</Text>}</SecondaryPage>
}
