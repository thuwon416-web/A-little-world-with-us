import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { addFinancialGoal, addFinancialProgress, FinancialGoal, getFinancialGoals } from '@/services/finance'

const mmk = (value: number) => `${value.toLocaleString()} MMK`

export default function FinanceScreen() {
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = async () => {
    try { setLoading(true); setGoals(await getFinancialGoals()); setError('') }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load goals.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [])
  const create = async () => {
    const targetAmount = Number(target); const currentAmount = Number(current || 0)
    if (!title.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(currentAmount) || currentAmount < 0) {
      Alert.alert('Check goal details', 'Enter a name and valid MMK amounts.'); return
    }
    try { await addFinancialGoal({ title: title.trim(), targetAmount, currentAmount }); setTitle(''); setTarget(''); setCurrent(''); await reload() }
    catch (caught) { Alert.alert('Unable to add goal', caught instanceof Error ? caught.message : 'Please try again.') }
  }
  const progress = async (goal: FinancialGoal) => {
    const amount = Number(await new Promise<string>((resolve) => Alert.prompt('Add progress', 'Amount in MMK', resolve)))
    if (!Number.isFinite(amount) || amount <= 0) return
    try { await addFinancialProgress(goal.id, goal.current_amount, amount); await reload() }
    catch (caught) { Alert.alert('Unable to update goal', caught instanceof Error ? caught.message : 'Please try again.') }
  }
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>Finance</Text><Text style={styles.title}>Shared goals</Text>
    <View style={styles.card}><TextInput value={title} onChangeText={setTitle} placeholder="Goal name" placeholderTextColor="#8d8d99" style={styles.input} />
      <TextInput value={target} onChangeText={setTarget} placeholder="Target (MMK)" placeholderTextColor="#8d8d99" keyboardType="numeric" style={styles.input} />
      <TextInput value={current} onChangeText={setCurrent} placeholder="Current (MMK)" placeholderTextColor="#8d8d99" keyboardType="numeric" style={styles.input} />
      <TouchableOpacity style={styles.primary} onPress={() => void create()}><Text style={styles.primaryText}>Add goal</Text></TouchableOpacity>
    </View>
    {loading ? <Text style={styles.muted}>Loading goals...</Text> : error ? <Text style={styles.error}>{error}</Text> : goals.length === 0 ? <Text style={styles.muted}>No shared goals yet.</Text> :
      goals.map((goal) => { const percent = Math.min(100, Math.max(0, goal.current_amount / goal.target_amount * 100)); return <View key={goal.id} style={styles.card}>
        <View style={styles.row}><Text style={styles.goal}>{goal.title}</Text><Text style={styles.muted}>{mmk(goal.current_amount)} / {mmk(goal.target_amount)}</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
        <TouchableOpacity onPress={() => void progress(goal)} style={styles.secondary}><Text style={styles.secondaryText}>Add progress</Text></TouchableOpacity>
      </View> })}
  </ScrollView>
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 },
  eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700', marginBottom: 8 },
  card: { backgroundColor: '#171b22', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#2a2d35', gap: 10 },
  input: { backgroundColor: '#0f0f12', borderRadius: 12, color: '#f3f0f5', padding: 12, borderWidth: 1, borderColor: '#2a2d35' },
  primary: { backgroundColor: '#d8b9c8', padding: 13, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#0f0f12', fontWeight: '800' },
  secondary: { borderRadius: 12, padding: 11, alignItems: 'center', backgroundColor: '#1f3b2f' },
  secondaryText: { color: '#f3f0f5', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  goal: { color: '#f3f0f5', fontSize: 18, fontWeight: '700', flex: 1 },
  muted: { color: '#c4c4ce' }, error: { color: '#ff9b9b' },
  track: { height: 10, backgroundColor: '#2a2d35', borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#d8b9c8' },
})
