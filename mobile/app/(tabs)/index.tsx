import { ScrollView, StyleSheet, Text, View } from 'react-native'

const dashboardCards = [
  { title: 'Days together', value: '387', tone: '#d9bfd7' },
  { title: 'Today', value: 'A quiet ritual', tone: '#8ed0c4' },
  { title: 'Memory', value: 'Sunset picnic', tone: '#8cb4ff' },
  { title: 'Care check', value: 'Feeling grounded', tone: '#ffd7a8' },
]

export default function DashboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Love dashboard</Text>
      <Text style={styles.title}>Good evening, KoKo × Pu Tuu</Text>
      <Text style={styles.subtitle}>
        Today’s focus: rest, breathe, and celebrate the little things.
      </Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Little ritual</Text>
        <Text style={styles.heroText}>
          Send a voice note and remind each other what felt beautiful today.
        </Text>
      </View>

      <View style={styles.grid}>
        {dashboardCards.map((card) => (
          <View key={card.title} style={[styles.card, { borderColor: card.tone }]}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={[styles.cardValue, { color: card.tone }]}>{card.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: '#0f0f12',
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
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#171b22',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2d35',
    padding: 20,
    marginBottom: 20,
  },
  heroLabel: {
    color: '#8ed0c4',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroText: {
    color: '#f3f0f5',
    fontSize: 18,
    lineHeight: 26,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#151a20',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    minHeight: 110,
  },
  cardTitle: {
    color: '#c4c4ce',
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
})
