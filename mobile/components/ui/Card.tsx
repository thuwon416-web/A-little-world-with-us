import React from 'react'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View, type ViewProps } from 'react-native'

import { designTokens } from '@/design-tokens'

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <BlurView intensity={35} tint="dark" {...props} style={[styles.card, style]}>
      <LinearGradient colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.035)']} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: designTokens.radii.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    padding: designTokens.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  content: { zIndex: 1 },
})
