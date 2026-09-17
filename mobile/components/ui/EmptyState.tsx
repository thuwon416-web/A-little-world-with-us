import type { LucideIcon } from 'lucide-react-native'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

import { useTheme } from '@/context/ThemeContext'

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
  const { colors } = useTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, style]}>
      <View style={styles.iconWrap}>
        <Icon color={colors.accent1} size={30} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text> : null}

      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: colors.accent1 }]}
          onPress={action.onPress}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
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
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    fontWeight: '700',
  },
})
