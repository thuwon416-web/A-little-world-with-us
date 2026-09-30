import React from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { haptics } from '@/lib/haptics'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps {
  title: string
  variant?: ButtonVariant
  disabled?: boolean
  accessibilityHint?: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  title,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme()
  const containerStyle = [
    styles.baseButton,
    variant === 'primary' ? { backgroundColor: colors.accent1 } : undefined,
    variant === 'secondary' ? { backgroundColor: colors.accent2 } : undefined,
    variant === 'outline' ? styles.outlineButton : undefined,
    variant === 'outline' ? { borderColor: colors.cardBorder } : undefined,
    disabled ? styles.disabledButton : undefined,
    style,
  ]

  const textStyles = [
    styles.baseText,
    variant === 'primary' ? { color: colors.background } : undefined,
    variant === 'secondary' ? { color: colors.background } : undefined,
    variant === 'outline' ? { color: colors.textPrimary } : undefined,
    textStyle,
  ]

  return (
    <Pressable
      style={({ pressed }) => [containerStyle, pressed ? styles.pressed : null]}
      onPress={() => {
        if (!disabled) {
          void haptics.light()
          onPress?.()
        }
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text style={textStyles}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  baseText: {
    fontWeight: '700',
    fontSize: 15,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
})
