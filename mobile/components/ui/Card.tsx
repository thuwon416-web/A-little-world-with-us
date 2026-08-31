import React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'
import { designTokens } from '@/design-tokens'

export function Card({ style, children, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: designTokens.colors.surface,
    borderRadius: designTokens.radii.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    padding: designTokens.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
})
