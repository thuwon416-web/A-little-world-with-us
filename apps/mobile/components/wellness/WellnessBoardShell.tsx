import React, { useMemo, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'

interface WellnessBoardShellProps {
  title: string
  subtitle?: string
  badge?: string
  children?: ReactNode
  onPress?: () => void
  selected?: boolean
}

export function WellnessBoardShell({
  title,
  subtitle,
  badge,
  children,
  onPress,
  selected = false,
}: WellnessBoardShellProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      android_ripple={{ color: colors.accent2 }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.body}>{children}</View> : null}
    </Pressable>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      minHeight: 180,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    cardSelected: {
      borderColor: colors.accent1,
      backgroundColor: colors.cardBg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    badge: {
      color: colors.accent2,
      backgroundColor: colors.cardBg,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
      fontSize: 10,
      fontWeight: '700',
      overflow: 'hidden',
    },
    body: {
      marginTop: 6,
    },
  })
