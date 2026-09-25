import { Stack, useSegments, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState, type ReactNode } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TextEncoder, TextDecoder } from 'text-encoding'

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder
}

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { I18nProvider } from '@/i18n/config'
import { AuthProvider, useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getSharingStatus, startLocationTracking } from '@/services/location'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback message={this.state.error?.message || 'An unexpected error occurred'} />
    }

    return this.props.children
  }
}

function ErrorFallback({ message }: { message: string }) {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  )
}

function ThemedStatusBar() {
  const { theme, colors } = useTheme()
  const isDark = theme === 'lavender-mist' || theme === 'monochrome'

  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
}

function MfaGate({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const segments = useSegments()
  const router = useRouter()
  const routeKey = segments.join('/')
  const [checkedKey, setCheckedKey] = useState('')
  const [requiredKey, setRequiredKey] = useState('')
  const currentKey = user ? `${user.id}:${routeKey}` : ''

  useEffect(() => {
    let active = true
    if (authLoading || !currentKey) {
      setCheckedKey(currentKey)
      return () => {
        active = false
      }
    }
    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      if (!active) return
      const needsMfa = !error && data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2'
      setRequiredKey(needsMfa ? currentKey : '')
      setCheckedKey(currentKey)
    })
    return () => {
      active = false
    }
  }, [authLoading, currentKey])

  useEffect(() => {
    if (checkedKey === currentKey && requiredKey === currentKey && !segments.includes('mfa')) {
      router.replace('/(tabs)/mfa')
    }
  }, [checkedKey, currentKey, requiredKey, segments, router])

  const isChecking = authLoading || checkedKey !== currentKey

  return (
    <View style={{ flex: 1 }}>
      {children}
      {isChecking && (
        <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="large" color={colors.accent1} />
        </View>
      )}
    </View>
  )
}

export default function RootLayout() {
  useEffect(() => {
    const autoStartLocation = async () => {
      try {
        const status = await getSharingStatus()
        if (status.enabled && status.permission === 'granted') {
          await startLocationTracking()
        }
      } catch (err) {
        console.warn('[Location] auto-start failed:', err)
      }
    }
    void autoStartLocation()
  }, [])

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <I18nProvider>
            <ThemeProvider>
              <ThemedStatusBar />
              <MfaGate>
                <Stack>
                  <Stack.Screen name="login" options={{ title: 'Login' }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
                </Stack>
              </MfaGate>
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorTitle: {
      fontSize: sizes.text.hMd,
      fontWeight: '700',
      marginBottom: 12,
    },
    errorMessage: {
      fontSize: sizes.text.body,
      textAlign: 'center',
    },
  })
