import { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { useTheme } from '@/context/ThemeContext'
import { acceptLink, declineLink, getContext, unlinkCoupleLink } from '@/services/secondary'

type CoupleLinkContext = Awaited<ReturnType<typeof getContext>>

export default function CoupleLinkingScreen() {
  const { colors } = useTheme()
  const [context, setContext] = useState<CoupleLinkContext | null>(null)
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
  const accepted = context?.link?.status === 'accepted'
  const isInviter = context?.link?.inviter_id === context?.user?.id
  const statusLabel = accepted
    ? 'Linked and accepted'
    : context?.link?.status === 'pending'
      ? isInviter
        ? 'Invitation sent'
        : 'Invitation received'
      : 'Not linked'
  const accept = async () => {
    if (!/^[a-zA-Z0-9]{6,}$/.test(code.trim()))
      return Alert.alert('Invalid code', 'Enter the invitation code.')
    if (!context) return Alert.alert('Unable to link', 'Please wait for link status to load.')
    try {
      await acceptLink(code.trim())
      setCode('')
      await load()
    } catch (caught) {
      Alert.alert('Unable to link', caught instanceof Error ? caught.message : 'Please try again.')
    }
  }
  return (
    <SecondaryPage title="Couple Linking">
      <View style={s.card}>
        <Text style={s.buttonText}>Status: {statusLabel}</Text>
        <Text style={s.muted}>
          Partner:{' '}
          {context?.link
            ? accepted
              ? 'Linked partner'
              : isInviter
                ? 'Invitation recipient'
                : 'Invitation sender'
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
                  onPress: () => (context.link ? void unlinkCoupleLink().then(load) : undefined),
                },
              ])
            }
          >
            <Text style={s.danger}>Unlink couple</Text>
          </TouchableOpacity>
        ) : null}
        {context?.link?.status === 'pending' && context.link.inviter_id !== context.user?.id ? (
          <TouchableOpacity
            onPress={() =>
              context.link ? void declineLink(context.link.id).then(load) : undefined
            }
          >
            <Text style={s.danger}>Decline invitation</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TextInput
        style={s.input}
        value={code}
        onChangeText={setCode}
        placeholder="Invitation code"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
      />
      <TouchableOpacity style={s.button} onPress={() => void accept()}>
        <Text style={s.buttonText}>Accept link</Text>
      </TouchableOpacity>
      {error ? <Text style={s.danger}>{error}</Text> : null}
    </SecondaryPage>
  )
}
