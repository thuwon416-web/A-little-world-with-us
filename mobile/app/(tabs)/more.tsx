import { useRouter } from 'expo-router'
import { LogOut, Settings, MapPin, CalendarDays, HeartPulse, Sparkles, Music2 } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '@/lib/auth'

const items = [
  { href: '/(tabs)/plans', label: 'Calendar & Plans', Icon: CalendarDays },
  { href: '/(tabs)/memories', label: 'Our Memories', Icon: HeartPulse },
  { href: '/(tabs)/wellness', label: 'Wellness & Play', Icon: HeartPulse },
  { href: '/(tabs)/settings', label: 'Settings', Icon: Settings },
  { href: '/(tabs)/location', label: 'Location Safety', Icon: MapPin },
  { href: '/(tabs)/ai', label: 'AI Guardian', Icon: Sparkles },
  { href: '/(tabs)/finance', label: 'Finance', Icon: HeartPulse },
  { href: '/(tabs)/profile', label: 'Profile', Icon: LogOut },
  { href: '/(tabs)/music', label: 'Music', Icon: Music2 },
] as const

export default function MoreScreen() {
  const { signOut } = useAuth()
  const router = useRouter()
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>More</Text>
      <Text style={styles.title}>Everything else</Text>
      <View style={styles.grid}>
        {items.map(({ href, label, Icon }) => (
          <TouchableOpacity key={label} style={styles.card} onPress={() => router.push(href)}>
            <Icon size={22} color="#d9bfd7" />
            <Text style={styles.label}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => void signOut()} style={styles.logout}>
        <LogOut size={18} color="#ff9b9b" />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72 },
  eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700', marginTop: 8, marginBottom: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', minHeight: 105, padding: 18, borderRadius: 18, backgroundColor: '#171b22', borderWidth: 1, borderColor: '#2a2d35', gap: 12 },
  label: { color: '#f3f0f5', fontSize: 14, fontWeight: '600' },
  logout: { marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: '#2f1f22', flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutText: { color: '#ff9b9b', fontWeight: '700' },
})
