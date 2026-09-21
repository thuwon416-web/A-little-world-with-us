import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { supabase } from '@/lib/supabase'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'

export default function LoginScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setIsLoggingIn(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoggingIn(false)

    if (error) {
      Alert.alert('Login Failed', error.message)
      return
    }

    if (data.user) {
      router.push('/(tabs)')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>A Little World for Us</Text>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>
        Keep the love close, the memories safe, and the moments together.
      </Text>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable
        style={[styles.primaryButton, isLoggingIn && styles.primaryButtonDisabled]}
        onPress={() => void handleLogin()}
        disabled={isLoggingIn}
      >
        <Text style={styles.primaryButtonText}>{isLoggingIn ? 'Logging in...' : 'Login'}</Text>
      </Pressable>
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  eyebrow: {
    color: colors.accent2,
    fontSize: sizes.text.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: sizes.text.dSm,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: sizes.text.body,
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.textPrimary,
    borderRadius: sizes.radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: sizes.text.body,
  },
  primaryButton: {
    backgroundColor: colors.accent1,
    borderRadius: sizes.radius.input,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: sizes.text.body,
  },
})
