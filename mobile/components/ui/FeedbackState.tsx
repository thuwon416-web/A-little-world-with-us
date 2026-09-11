import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { designTokens } from '@/design-tokens'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return <View style={styles.state}><ActivityIndicator color={designTokens.colors.secondary} /><Text style={styles.muted}>{label}</Text></View>
}

export function EmptyState({ icon = '✨', title, message, actionLabel, onAction }: { icon?: string; title: string; message: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.state}><Text style={styles.icon}>{icon}</Text><Text style={styles.title}>{title}</Text><Text style={styles.muted}>{message}</Text>{actionLabel && onAction ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.button} onPress={onAction}><Text style={styles.buttonText}>{actionLabel}</Text></TouchableOpacity> : null}</View>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <View style={styles.state}><Text style={styles.icon}>😕</Text><Text style={styles.title}>Something went wrong</Text><Text style={styles.muted}>{message}</Text>{onRetry ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Try again" style={styles.button} onPress={onRetry}><Text style={styles.buttonText}>Try again</Text></TouchableOpacity> : null}</View>
}

export function Skeleton({ width = '100%', height = 18, radius = 8 }: { width?: number | `${number}%`; height?: number; radius?: number }) {
  return <View accessible accessibilityLabel="Loading content" style={[styles.skeleton, { width, height, borderRadius: radius }]} />
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  icon: { fontSize: 36 },
  title: { color: designTokens.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  muted: { color: designTokens.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { backgroundColor: designTokens.colors.secondary, borderRadius: designTokens.radii.md, paddingVertical: 12, paddingHorizontal: 18, marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700' },
  skeleton: { backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
})
