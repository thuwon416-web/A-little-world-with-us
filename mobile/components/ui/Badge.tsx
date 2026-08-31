import React from 'react'
import { StyleSheet, Text, View, type ViewProps } from 'react-native'

import { designTokens } from '@/design-tokens'

interface BadgeProps extends ViewProps {
  label: string
  tone?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export function Badge({ label, tone = 'primary', style, ...props }: BadgeProps) {
  const badgeToneStyle =
    tone === 'primary'
      ? styles.primaryBadge
      : tone === 'secondary'
        ? styles.secondaryBadge
        : tone === 'success'
          ? styles.successBadge
          : tone === 'warning'
            ? styles.warningBadge
            : styles.dangerBadge

  const textToneStyle =
    tone === 'primary'
      ? styles.primaryText
      : tone === 'secondary'
        ? styles.secondaryText
        : tone === 'success'
          ? styles.successText
          : tone === 'warning'
            ? styles.warningText
            : styles.dangerText

  return (
    <View {...props} style={[styles.badge, badgeToneStyle, style]}>
      <Text style={[styles.text, textToneStyle]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: designTokens.radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryBadge: { backgroundColor: 'rgba(184,138,229,0.18)' },
  primaryText: { color: designTokens.colors.primary },
  secondaryBadge: { backgroundColor: 'rgba(255,107,129,0.18)' },
  secondaryText: { color: designTokens.colors.secondary },
  successBadge: { backgroundColor: 'rgba(47,143,102,0.18)' },
  successText: { color: designTokens.colors.success },
  warningBadge: { backgroundColor: 'rgba(216,161,51,0.18)' },
  warningText: { color: designTokens.colors.warning },
  dangerBadge: { backgroundColor: 'rgba(217,83,79,0.18)' },
  dangerText: { color: designTokens.colors.danger },
})
