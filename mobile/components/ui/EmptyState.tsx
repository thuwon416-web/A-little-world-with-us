import type { LucideIcon } from 'lucide-react-native'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { designTokens } from '@/design-tokens'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
  style?: StyleProp<ViewStyle>
}

export function EmptyState({ icon: Icon, title, description, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconWrap}>
        <Icon color={designTokens.colors.secondary} size={30} />
      </View>

      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}

      {action ? (
        <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={action.onPress}>
          <Text style={styles.buttonText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(23, 27, 34, 0.72)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(184, 138, 229, 0.28)',
    gap: 12,
    justifyContent: 'center',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(23, 27, 34, 0.96)',
    borderColor: 'rgba(184, 138, 229, 0.28)',
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    color: designTokens.colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: designTokens.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radii.md,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
})
