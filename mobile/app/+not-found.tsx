import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

export default function NotFoundScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>A LITTLE WORLD WITH US</Text>
      <Text style={styles.title}>This screen wandered off</Text>
      <Text style={styles.text}>The page you&apos;re looking for is not available.</Text>
      <Link href="/(tabs)" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go home</Text>
        </Pressable>
      </Link>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  eyebrow: {
    color: colors.accent2,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.accent1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '700',
  },
})
