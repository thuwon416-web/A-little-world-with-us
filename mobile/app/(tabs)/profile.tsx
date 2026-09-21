import { useState, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import BiometricAuth from '@/components/BiometricAuth'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'

export default function ProfileScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors, sizes), [colors])
  const { user, signOut } = useAuth()
  const [showBiometricAuth, setShowBiometricAuth] = useState(false)

  const handleBiometricSuccess = () => {
    setShowBiometricAuth(false)
    // Handle successful biometric authentication
  }

  return (
    <View style={styles.container}>
      {showBiometricAuth ? (
        <BiometricAuth
          onSuccess={handleBiometricSuccess}
          onCancel={() => setShowBiometricAuth(false)}
        />
      ) : (
        <>
          <Text style={styles.eyebrow}>Profile</Text>
          <Text style={styles.title}>KoKo × Pu Tuu</Text>
          <Text style={styles.subtitle}>Shared home, secure memories, and quiet love rituals.</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Relationship status</Text>
            <Text style={styles.cardValue}>Linked and protected</Text>
          </View>

          {user && (
            <View style={styles.metaCard}>
              <Text style={styles.cardLabel}>Signed in as</Text>
              <Text style={styles.metaValue}>{user.email ?? 'No email available'}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowBiometricAuth(true)}
          >
            <Text style={styles.secondaryButtonText}>Enable Biometric Auth</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => void signOut()}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 72,
      paddingHorizontal: 20,
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
      fontSize: sizes.text.hLg,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: sizes.text.body,
      lineHeight: 22,
      marginBottom: 22,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 16,
    },
    metaCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.card,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 20,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.btn,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.accent1,
    },
    secondaryButtonText: {
      color: colors.accent1,
      fontSize: sizes.text.body,
      fontWeight: '600',
    },
    cardLabel: {
      color: colors.textSecondary,
      fontSize: sizes.text.xs,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    cardValue: {
      color: colors.textPrimary,
      fontSize: sizes.text.hSm,
      fontWeight: '600',
    },
    metaValue: {
      color: colors.textPrimary,
      fontSize: sizes.text.body,
      fontWeight: '500',
    },
    button: {
      backgroundColor: colors.accent1,
      borderRadius: sizes.radius.btn,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.background,
      fontWeight: '700',
      fontSize: sizes.text.body,
    },
  })
