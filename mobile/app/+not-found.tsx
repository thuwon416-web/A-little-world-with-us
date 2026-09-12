import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function NotFoundScreen() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f12',
    padding: 24,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  eyebrow: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 12,
  },
  text: {
    color: '#c4c4ce',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8ed0c4',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#101317',
    fontWeight: '700',
  },
})
