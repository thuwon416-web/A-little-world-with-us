import React from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { designTokens } from '@/design-tokens'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        style={[styles.input, style, error ? styles.inputError : null]}
        placeholderTextColor={designTokens.colors.muted}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: designTokens.spacing.md },
  label: {
    color: designTokens.colors.text,
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: designTokens.colors.surface,
    color: designTokens.colors.text,
    borderRadius: designTokens.radii.md,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: designTokens.colors.danger,
  },
  errorText: {
    color: designTokens.colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
})
