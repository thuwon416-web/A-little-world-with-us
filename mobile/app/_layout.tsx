import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { I18nProvider } from '@/i18n/config'
import { AuthProvider } from '@/lib/auth'
import '@/services/location'

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
  return (
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
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
})
