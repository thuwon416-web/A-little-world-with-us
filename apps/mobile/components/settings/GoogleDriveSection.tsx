'use client'

import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { sizes } from '@/design-tokens'
import {
  disconnectGoogleDrive,
  getGoogleDriveClientIdForPlatform,
  getGoogleDriveRedirectUri,
  hasGoogleDriveConnection,
  saveGoogleDriveToken,
} from '@/lib/googleDrive'

WebBrowser.maybeCompleteAuthSession()

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

export default function GoogleDriveSection() {
  const { colors } = useTheme()
  const styles = useMemo(
    () => ({
      card: {
        backgroundColor: colors.background,
        borderRadius: sizes.radius.input,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: 10,
      },
      text: { color: colors.textPrimary, fontSize: sizes.text.sm, lineHeight: 20 },
      muted: { color: colors.textSecondary, fontSize: sizes.text.xs, lineHeight: 18 },
      button: {
        backgroundColor: colors.accent1,
        borderRadius: sizes.radius.btn,
        paddingVertical: 12,
        alignItems: 'center' as const,
      },
      buttonText: { color: colors.background, fontWeight: '800' as const },
    }),
    [colors]
  )
  const clientId = getGoogleDriveClientIdForPlatform(Platform.OS === 'android' ? 'android' : 'ios')
  const redirectUri = getGoogleDriveRedirectUri()
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
      },
    },
    discovery
  )

  useEffect(() => {
    void hasGoogleDriveConnection().then(setConnected)
  }, [])

  useEffect(() => {
    if (!response || response.type !== 'success' || !request?.codeVerifier || !clientId) return
    const code = response.params?.code
    if (!code) return

    let active = true
    setBusy(true)
    void AuthSession.exchangeCodeAsync(
      {
        clientId,
        code,
        redirectUri,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery
    )
      .then(async (token) => {
        if (!active) return
        await saveGoogleDriveToken(token)
        setConnected(true)
        Alert.alert('Google Drive', 'Google Drive is connected on this device.')
      })
      .catch((error) => {
        if (active)
          Alert.alert(
            'Google Drive',
            error instanceof Error ? error.message : 'Unable to finish Google Drive authorization.'
          )
      })
      .finally(() => {
        if (active) setBusy(false)
      })

    return () => {
      active = false
    }
  }, [clientId, redirectUri, request?.codeVerifier, response])

  const connect = async () => {
    if (!clientId) {
      Alert.alert(
        'Google Drive',
        'Add the native Google Drive OAuth client ID to the mobile environment first.'
      )
      return
    }
    if (!request) {
      Alert.alert('Google Drive', 'The secure Google authorization request is still loading.')
      return
    }
    setBusy(true)
    try {
      await promptAsync()
    } catch (error) {
      Alert.alert(
        'Google Drive',
        error instanceof Error ? error.message : 'Unable to open Google authorization.'
      )
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    await disconnectGoogleDrive()
    setConnected(false)
  }

  return (
    <View style={styles.card}>
      <Text style={styles.text}>Google Drive</Text>
      <Text style={styles.muted}>
        {connected
          ? 'Connected. Drive files can be used by the mobile media layer.'
          : 'Not connected. Your app can connect with Google using PKCE without a client secret.'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        disabled={busy}
        onPress={() => void (connected ? disconnect() : connect())}
      >
        <Text style={styles.buttonText}>
          {busy ? 'Connecting…' : connected ? 'Disconnect Google Drive' : 'Connect Google Drive'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
