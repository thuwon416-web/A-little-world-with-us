import React, { type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

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
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
      android_ripple={{ color: '#f6d5d9' }}
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#171722',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2b2c3e',
    padding: 16,
    minHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardSelected: {
    borderColor: '#d5b0c7',
    backgroundColor: '#1d1a2d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: '#f4edf5',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  subtitle: {
    color: '#d7c7d6',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  badge: {
    color: '#f0c9d9',
    backgroundColor: '#2a2131',
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
