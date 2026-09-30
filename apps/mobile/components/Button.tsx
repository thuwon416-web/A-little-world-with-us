import { Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface ButtonProps {
  title: string
  onPress: () => void
}

export function Button({ title, onPress }: ButtonProps) {
  const { colors } = useTheme()
  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor: colors.accent1 }]}>
      <Text style={[styles.text, { color: colors.background }]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
  },
})
