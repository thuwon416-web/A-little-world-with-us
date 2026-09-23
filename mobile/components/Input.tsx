import { StyleSheet, TextInput, TextInputProps } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export function Input(props: TextInputProps) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textSecondary}
      style={[styles.input, props.style]}
      autoCapitalize="sentences"
      autoCorrect={false}
    />
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 12,
      color: colors.textPrimary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
  })
