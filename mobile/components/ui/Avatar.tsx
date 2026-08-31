import React from 'react'
import { StyleSheet, Text, View, type ViewProps } from 'react-native'
import { designTokens } from '@/design-tokens'

interface AvatarProps extends ViewProps {
  label?: string
  size?: number
}

export function Avatar({ label = 'A', size = 42, style, ...props }: AvatarProps) {
  return (
    <View {...props} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.text, { fontSize: Math.max(12, size * 0.35) }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: designTokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#110D1A',
    fontWeight: '700',
  },
})
