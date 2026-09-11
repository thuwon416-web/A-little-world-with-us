import React from 'react'
import * as Haptics from 'expo-haptics'
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { designTokens } from '@/design-tokens'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps {
  title: string
  variant?: ButtonVariant
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  title,
  variant = 'primary',
  disabled = false,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const containerStyle = [
    styles.baseButton,
    variant === 'primary' ? styles.primaryButton : undefined,
    variant === 'secondary' ? styles.secondaryButton : undefined,
    variant === 'outline' ? styles.outlineButton : undefined,
    disabled ? styles.disabledButton : undefined,
    style,
  ]

  const textStyles = [
    styles.baseText,
    variant === 'primary' ? styles.primaryText : undefined,
    variant === 'secondary' ? styles.secondaryText : undefined,
    variant === 'outline' ? styles.outlineText : undefined,
    textStyle,
  ]

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, pressed ? styles.pressed : null]}
      onPress={() => {
        if (!disabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress?.()
        }
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      <Text style={textStyles}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: designTokens.radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '700',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: designTokens.colors.primary,
  },
  secondaryButton: {
    backgroundColor: designTokens.colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: designTokens.colors.border,
  },
  primaryText: {
    color: '#110D1A',
  },
  secondaryText: {
    color: designTokens.colors.text,
  },
  outlineText: {
    color: designTokens.colors.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
})
