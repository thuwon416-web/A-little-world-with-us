import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
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
      <Text style={styles.subtitle}>Keep the love close, the memories safe, and the moments together.</Text>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8d8d99"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#8d8d99"
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable style={[styles.primaryButton, isLoggingIn && styles.primaryButtonDisabled]} onPress={() => void handleLogin()} disabled={isLoggingIn}>
        <Text style={styles.primaryButtonText}>{isLoggingIn ? 'Logging in...' : 'Login'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    backgroundColor: '#0f0f12',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#f4f0f5',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: '#c6c6d0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    gap: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#171b22',
    borderWidth: 1,
    borderColor: '#2a2d35',
    color: '#f3f0f5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#b88ae5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#110d1a',
    fontWeight: '700',
    fontSize: 16,
  },
})
