import { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { useTheme } from '@/context/ThemeContext'
import {
  acceptLink,
  createLinkInvite,
  declineLink,
  getContext,
  unlinkCoupleLink,
} from '@/services/secondary'

type CoupleLinkContext = Awaited<ReturnType<typeof getContext>>

function getStatusLabel(context: CoupleLinkContext | null) {
  if (context?.link?.status === 'accepted') return 'Linked and accepted'
  if (context?.link?.status !== 'pending') return 'Not linked'
  return context.link.inviter_id === context.user?.id ? 'Invitation sent' : 'Invitation received'
}

function getPartnerLabel(context: CoupleLinkContext | null) {
  if (!context?.link) return 'No partner linked'
  if (context.link.status === 'accepted') return 'Linked partner'
  return context.link.inviter_id === context.user?.id ? 'Invitation recipient' : 'Invitation sender'
}

function showUnlinkConfirmation(onUnlink: () => void) {
  Alert.alert('Unlink couple?', 'This revokes the accepted link.', [
    { text: 'Cancel' },
    { text: 'Unlink', style: 'destructive', onPress: onUnlink },
  ])
}

type LinkStatusCardProps = {
  context: CoupleLinkContext | null
  onUnlink: () => void
  onDecline: () => void
}

function LinkStatusCard({ context, onUnlink, onDecline }: LinkStatusCardProps) {
  const accepted = context?.link?.status === 'accepted'
  const isInviter = context?.link?.inviter_id === context?.user?.id

  return (
    <View style={s.card}>
      <Text style={s.buttonText}>Status: {getStatusLabel(context)}</Text>
      <Text style={s.muted}>Partner: {getPartnerLabel(context)}</Text>
      {accepted ? (
        <TouchableOpacity onPress={() => showUnlinkConfirmation(onUnlink)}>
          <Text style={s.danger}>Unlink couple</Text>
        </TouchableOpacity>
      ) : null}
      {context?.link?.status === 'pending' && !isInviter ? (
        <TouchableOpacity onPress={onDecline}>
          <Text style={s.danger}>Decline invitation</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export default function CoupleLinkingScreen() {
  const { colors } = useTheme()
  const [context, setContext] = useState<CoupleLinkContext | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const load = async () => {
    try {
      setContext(await getContext())
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to load link status.')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const createInvite = async () => {
    try {
      setIsCreating(true)
      setError('')
      const created = await createLinkInvite()
      setInviteCode(created)
      await load()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Unable to create invite.')
    } finally {
      setIsCreating(false)
    }
  }
  const accept = async () => {
    if (!/^[a-zA-Z0-9]{8}$/.test(code.trim()))
      return Alert.alert('Invalid code', 'Enter the invitation code.')
    if (!context) return Alert.alert('Unable to link', 'Please wait for link status to load.')
    try {
      await acceptLink(code.trim())
      setCode('')
      await load()
    } catch (error_) {
      Alert.alert('Unable to link', error_ instanceof Error ? error_.message : 'Please try again.')
    }
  }
  const unlink = () => {
    void unlinkCoupleLink().then(load)
  }
  const decline = () => {
    if (context?.link) void declineLink(context.link.id).then(load)
  }
  return (
    <SecondaryPage title="Couple Linking">
      <LinkStatusCard context={context} onUnlink={unlink} onDecline={decline} />
      {!context?.link ? (
        <TouchableOpacity
          style={s.button}
          onPress={() => void createInvite()}
          disabled={isCreating}
        >
          <Text style={s.buttonText}>{isCreating ? 'Creating…' : 'Create invite code'}</Text>
        </TouchableOpacity>
      ) : null}
      {inviteCode ? <Text style={s.buttonText}>Code: {inviteCode}</Text> : null}
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
