import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function SecondaryPage({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.container}><Text style={styles.eyebrow}>{eyebrow ?? 'MORE'}</Text><Text style={styles.title}>{title}</Text>{children}</ScrollView>
}
export const secondaryStyles = StyleSheet.create({
  card: { backgroundColor: '#171b22', borderRadius: 16, padding: 15, gap: 8 },
  input: { backgroundColor: '#171b22', color: '#fff', borderRadius: 12, padding: 12 },
  button: { backgroundColor: '#ff6b81', borderRadius: 12, padding: 13, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800' },
  muted: { color: '#c4c4ce', lineHeight: 20 },
  danger: { color: '#ff9b9b' },
})
const styles = StyleSheet.create({ container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 }, eyebrow: { color: '#d9bfd7', letterSpacing: 2, fontSize: 12 }, title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' } })
