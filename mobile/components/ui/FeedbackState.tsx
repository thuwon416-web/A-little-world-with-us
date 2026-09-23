import { CircleAlert, Sparkles } from 'lucide-react-native'
import type { ComponentType } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.accent2} />
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: ComponentType<any>
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  const { colors } = useTheme()
  return (
    <View style={styles.state}>
      <Icon size={36} color={colors.accent1} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={[styles.button, { backgroundColor: colors.accent1 }]}
          onPress={onAction}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={styles.state}>
      <CircleAlert size={36} color={colors.error} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.muted, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={[styles.button, { backgroundColor: colors.accent1 }]}
          onPress={onRetry}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>Try again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export function Skeleton({
  width = '100%',
  height = 18,
  radius = 8,
}: {
  width?: number | `${number}%`
  height?: number
  radius?: number
}) {
  return (
    <View
      accessible
      accessibilityLabel="Loading content"
      style={[styles.skeleton, { width, height, borderRadius: radius }]}
    />
  )
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  icon: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  muted: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  buttonText: { fontWeight: '700' },
  skeleton: { overflow: 'hidden' },
})
