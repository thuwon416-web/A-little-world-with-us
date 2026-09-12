import { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { acceptLink, declineLink, getContext, unlinkCoupleLink } from '@/services/secondary'
export default function CoupleLinkingScreen() {
  const [context, setContext] = useState<any>()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const load = async () => {
    try {
      setContext(await getContext())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load link status.')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const accept = async () => {
    if (!/^[a-zA-Z0-9]{6,}$/.test(code.trim()))
      return Alert.alert('Invalid code', 'Enter the invitation code.')
    try {
      await acceptLink(context.user.id, code.trim())
      setCode('')
      await load()
    } catch (caught) {
      Alert.alert('Unable to link', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  return (
    <SecondaryPage title="Couple Linking">
      <View style={s.card}>
        <Text style={s.buttonText}>Status: {context?.link?.status ?? 'Not linked'}</Text>
        <Text style={s.muted}>
          Partner:{' '}
          {context?.link
            ? context.link.inviter_id === context.user?.id
              ? 'Invitation recipient'
              : 'Invitation sent'
            : 'No partner linked'}
        </Text>
        {context?.link?.status === 'accepted' ? (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Unlink couple?', 'This revokes the accepted link.', [
                { text: 'Cancel' },
                {
                  text: 'Unlink',
                  style: 'destructive',
                  onPress: () => void unlinkCoupleLink(context.link.id).then(load),
                },
              ])
            }
          >
            <Text style={s.danger}>Unlink couple</Text>
          </TouchableOpacity>
        ) : null}
        {context?.link?.status === 'pending' && context.link.inviter_id !== context.user?.id ? (
          <TouchableOpacity onPress={() => void declineLink(context.link.id).then(load)}>
            <Text style={s.danger}>Decline invitation</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TextInput
        style={s.input}
        value={code}
        onChangeText={setCode}
        placeholder="Invitation code"
        placeholderTextColor="#8d8d99"
        autoCapitalize="none"
      />
      <TouchableOpacity style={s.button} onPress={() => void accept()}>
        <Text style={s.buttonText}>Accept link</Text>
      </TouchableOpacity>
      {error ? <Text style={s.danger}>{error}</Text> : null}
    </SecondaryPage>
  )
}
