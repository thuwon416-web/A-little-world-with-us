import React from 'react'
import { StyleSheet, Text, View, type ViewProps } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface AvatarProps extends ViewProps {
  label?: string
  size?: number
}

export function Avatar({ label = 'A', size = 42, style, ...props }: AvatarProps) {
  const { colors } = useTheme()
  return (
    <View
      {...props}
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent1 },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: colors.background, fontSize: Math.max(12, size * 0.35) }]}
      >
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
  },
})
