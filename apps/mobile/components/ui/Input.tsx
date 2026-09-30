import React from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text> : null}
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: colors.cardBorder,
          },
          style,
          error ? { borderColor: colors.error } : null,
        ]}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label ?? props.placeholder}
      />
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
})
