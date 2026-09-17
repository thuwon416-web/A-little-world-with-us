import { ScrollView, StyleSheet, Text } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

export default function SecondaryPage({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow?: string
  children: React.ReactNode
}) {
  const { colors } = useTheme()
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.eyebrow, { color: colors.accent2 }]}>{eyebrow ?? 'MORE'}</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </ScrollView>
  )
}
export const secondaryStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 15, gap: 8 },
  input: { borderRadius: 12, padding: 12 },
  button: { borderRadius: 12, padding: 13, alignItems: 'center' },
  buttonText: { fontWeight: '800' },
  muted: { lineHeight: 20 },
  danger: {},
})
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 72, gap: 14 },
  eyebrow: { letterSpacing: 2, fontSize: 12 },
  title: { fontSize: 30, fontWeight: '700' },
})
