'use client'

import * as Linking from 'expo-linking'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'

import { useTheme } from '@/context/ThemeContext'
import { sizes } from '@/design-tokens'
import {
  disconnectGoogleDrive,
  getGoogleDriveClientIdForPlatform,
  createGoogleDriveAuthorizationUrl,
  exchangeGoogleDriveCode,
  hasGoogleDriveConnection,
} from '@/lib/googleDrive'

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
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    const handledUrls = new Set<string>()

    const handleUrl = async (url: string) => {
      if (handledUrls.has(url)) return
      handledUrls.add(url)
      const parsed = Linking.parse(url)
      if (parsed.scheme !== 'com.alittleworldwithus.app' || parsed.path !== 'oauth2redirect') return
      const state = typeof parsed.queryParams?.state === 'string' ? parsed.queryParams.state : ''
      const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : ''
      const error = typeof parsed.queryParams?.error === 'string' ? parsed.queryParams.error : ''
      const verifierKey = 'a-little-world-with-us-google-drive-pkce'
      const stateKey = `${verifierKey}-state`
      try {
        if (!clientId) throw new Error('Native Google Drive OAuth client ID is not configured.')
        const verifier = await SecureStore.getItemAsync(verifierKey)
        const expectedState = await SecureStore.getItemAsync(stateKey)
        await SecureStore.deleteItemAsync(verifierKey)
        await SecureStore.deleteItemAsync(stateKey)
        if (!verifier || !expectedState || state !== expectedState) {
          throw new Error('Google Drive authorization state could not be verified.')
        }
        if (error) throw new Error('Google Drive authorization was cancelled.')
        if (!code) throw new Error('Google Drive did not return an authorization code.')
        await exchangeGoogleDriveCode(clientId, code, verifier)
        if (!active) return
        setConnected(true)
        setBusy(false)
        Alert.alert('Google Drive', 'Google Drive is connected on this device.')
      } catch (error_) {
        if (!active) return
        setBusy(false)
        Alert.alert(
          'Google Drive',
          error_ instanceof Error ? error_.message : 'Unable to finish Google Drive authorization.'
        )
      }
    }

    void hasGoogleDriveConnection().then((value) => {
      if (active) setConnected(value)
    })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url)
    })
    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url)
    })
    return () => {
      active = false
      subscription.remove()
    }
  }, [clientId])

  const connect = async () => {
    if (!clientId) {
      Alert.alert('Google Drive', 'Add the native Google Drive OAuth client ID to the mobile environment first.')
      return
    }
    setBusy(true)
    try {
      const { url, codeVerifier, state } = await createGoogleDriveAuthorizationUrl(clientId)
      await SecureStore.setItemAsync('a-little-world-with-us-google-drive-pkce', codeVerifier)
      await SecureStore.setItemAsync('a-little-world-with-us-google-drive-pkce-state', state)
      await Linking.openURL(url)
    } catch (error) {
      setBusy(false)
      Alert.alert('Google Drive', error instanceof Error ? error.message : 'Unable to open Google authorization.')
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
          ? 'Connected on this device. Shared memories use the secure server-backed Drive connection so Web and Mobile share the same file access.'
          : 'Not connected on this device. This native connection is for device-local Drive tools; shared memories use the server-backed Drive connection.'}
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
