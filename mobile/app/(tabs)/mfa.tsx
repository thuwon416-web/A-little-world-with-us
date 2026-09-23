import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function MfaScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const startChallenge = async () => {
      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assuranceError) throw assuranceError
      if (assurance?.currentLevel === 'aal2') {
        router.replace('/(tabs)')
        return
      }
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError
      const factor = factors?.totp.find((item) => item.status === 'verified')
      if (!factor) throw new Error('အတည်ပြုထားသော စနစ်မတွေ့ပါ။ ဆက်တင်ကို ပြန်စစ်ပါ။')
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      })
      if (challengeError) throw challengeError
      if (active) {
        setFactorId(factor.id)
        setChallengeId(challenge.id)
      }
    }
    void startChallenge()
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : 'အတည်ပြုကုဒ် တောင်း၍မရပါ။')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt, router, user?.id])

  const verify = async () => {
    if (!factorId || !challengeId || !/^\d{6}$/.test(code) || verifying) return
    setVerifying(true)
    setError('')
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
    if (verifyError) {
      setError('ကုဒ်မှားနေသည် သို့မဟုတ် အချိန်ကုန်သွားသည်။ ပြန်စစ်ပြီး ထပ်ထည့်ပါ။')
      setCode('')
      setVerifying(false)
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      >
        <Text style={[styles.kicker, { color: colors.accent1 }]}>အကောင့်လုံခြုံရေး</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>ဝင်ရောက်မှုကို အတည်ပြုပါ</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          အတည်ပြုအက်ပ်မှ ပြသသော ဂဏန်း ၆ လုံးကို ထည့်ပါ။
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.accent1} />
        ) : (
          <>
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="ဂဏန်း ၆ လုံး"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              maxLength={6}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.background,
                },
              ]}
            />
            {error ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.error }]}>
                {error}
              </Text>
            ) : null}
            {error && !factorId ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setError('')
                  setLoading(true)
                  setAttempt((current) => current + 1)
                }}
              >
                <Text style={[styles.link, { color: colors.accent1 }]}>ပြန်ကြိုးစားရန်</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              disabled={code.length !== 6 || verifying || !factorId}
              onPress={() => void verify()}
              style={[
                styles.button,
                {
                  backgroundColor: colors.accent1,
                  opacity: code.length !== 6 || verifying || !factorId ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {verifying ? 'စစ်ဆေးနေသည်…' : 'အတည်ပြုပြီး ဆက်ရန်'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity accessibilityRole="button" onPress={() => void signOut()}>
          <Text style={[styles.link, { color: colors.accent1 }]}>အကောင့်မှ ထွက်ရန်</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { gap: 16, padding: 22, borderWidth: 1, borderRadius: 22 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontSize: 26, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    letterSpacing: 5,
    textAlign: 'center',
  },
  error: { fontSize: 13, lineHeight: 19 },
  button: { alignItems: 'center', padding: 14, borderRadius: 12 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  link: { textAlign: 'center', fontSize: 12, lineHeight: 18 },
})
