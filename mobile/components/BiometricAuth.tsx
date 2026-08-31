import * as LocalAuthentication from 'expo-local-authentication'
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react-native'
import React, { useState, useEffect } from 'react'
import { Text, View, TouchableOpacity, StyleSheet, Alert } from 'react-native'

interface BiometricAuthProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function BiometricAuth({ onSuccess, onCancel }: BiometricAuthProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [biometricType, setBiometricType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkBiometricSupport()
  }, [])

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      setIsSupported(compatible)

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID')
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint')
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris')
        } else {
          setBiometricType('Biometric')
        }
      }
    } catch (error) {
      // Silently handle error
    }
  }

  const handleAuthenticate = async () => {
    if (!isSupported) {
      Alert.alert(
        'Biometric Not Available',
        'Your device does not support biometric authentication.'
      )
      return
    }

    setIsLoading(true)

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Our Forever',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      })

      if (result.success) {
        setIsAuthenticated(true)
        onSuccess()
      } else {
        Alert.alert('Authentication Failed', 'Please try again or use your passcode.')
      }
    } catch (error) {
      Alert.alert('Authentication Error', 'An error occurred during authentication.')
    } finally {
      setIsLoading(false)
    }
  }

  const getBiometricIcon = () => {
    if (biometricType === 'Face ID') {
      return <ShieldCheck size={32} color="#B88AE5" />
    }
    return <Fingerprint size={32} color="#B88AE5" />
  }

  if (!isSupported) {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Lock size={32} color="#D5C4D4" />
        </View>
        <Text style={styles.title}>Biometric Not Available</Text>
        <Text style={styles.message}>
          Your device doesn't support biometric authentication. You can use your passcode instead.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onCancel}>
          <Text style={styles.buttonText}>Use Passcode</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{getBiometricIcon()}</View>
      <Text style={styles.title}>Authenticate</Text>
      <Text style={styles.message}>
        Use {biometricType} to securely access your relationship space
      </Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleAuthenticate}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Authenticating...' : `Use ${biometricType}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F0F12',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1F232A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F3F0F5',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#C4C4CE',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#B88AE5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0F0F12',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
  },
  cancelButtonText: {
    color: '#C4C4CE',
    fontSize: 14,
  },
})
