import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '@/lib/auth'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Profile</Text>
      <Text style={styles.title}>KoKo × Pu Tuu</Text>
      <Text style={styles.subtitle}>Shared home, secure memories, and quiet love rituals.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Relationship status</Text>
        <Text style={styles.cardValue}>Linked and protected</Text>
      </View>

      {user && (
        <View style={styles.metaCard}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.metaValue}>{user.email ?? 'No email available'}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={() => void signOut()}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingHorizontal: 20,
  },
  eyebrow: {
    color: '#d9bfd7',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#c4c4ce',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
    marginBottom: 16,
  },
  metaCard: {
    backgroundColor: '#171b22',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
    marginBottom: 20,
  },
  cardLabel: {
    color: '#8d8d99',
    fontSize: 12,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    color: '#f3f0f5',
    fontSize: 20,
    fontWeight: '600',
  },
  metaValue: {
    color: '#f3f0f5',
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#ff6b81',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
