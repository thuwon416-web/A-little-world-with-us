import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export function Card({ style, children, ...props }: ViewProps) {
  const { colors } = useTheme()

  return (
    <BlurView
      intensity={24}
      tint="dark"
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.accent1,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[`${colors.accent1}20`, `${colors.accent2}10`, 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  content: { zIndex: 1 },
})
