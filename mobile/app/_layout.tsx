import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { I18nProvider } from '@/i18n/config'
import { AuthProvider } from '@/lib/auth'
import { getSharingStatus, startLocationTracking } from '@/services/location'

// Error Boundary Component
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
              <Stack>
                <Stack.Screen name="login" options={{ title: 'Login' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
              </Stack>
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) => StyleSheet.create({
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
