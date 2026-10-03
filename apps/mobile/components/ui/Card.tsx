import React from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

export function Card({ style, children, ...props }: ViewProps) {
  const { colors } = useTheme()
  return <View {...props} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, style]}>{children}</View>
}
const styles = StyleSheet.create({ card: { borderRadius: 20, borderWidth: 1, padding: 20, shadowColor: '#4a3860', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 } })
