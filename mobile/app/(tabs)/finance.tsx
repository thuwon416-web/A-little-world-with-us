import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useAuth } from '@/lib/auth'
import {
  checkInStreak,
  getAdvancedData,
  getDateIdeas,
  saveBudget,
  addBill,
} from '@/services/advanced'
import { addFinancialProgress, addFinancialGoal, type FinancialGoal } from '@/services/finance'

const mmk = (value: number) => `${Number(value).toLocaleString()} MMK`

export default function FinanceScreen() {
  const { user } = useAuth()
  const [data, setData] = useState<any>()
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [budget, setBudget] = useState('')
  const [billTitle, setBillTitle] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billDate, setBillDate] = useState('')
  const [ideas, setIdeas] = useState<any[]>([])
  const [error, setError] = useState('')
  const load = async () => {
    try {
      setData(await getAdvancedData())
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load shared finance.')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const spent = useMemo(
    () => (data?.expenses ?? []).reduce((sum: number, item: any) => sum + Number(item.amount), 0),
    [data]
  )
  const addGoal = async () => {
    const targetAmount = Number(target)
    const currentAmount = Number(current || 0)
    if (!title.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || currentAmount < 0)
      return Alert.alert('Check goal details', 'Enter a name and valid amounts.')
    try {
      await addFinancialGoal({ title: title.trim(), targetAmount, currentAmount })
      setTitle('')
      setTarget('')
      setCurrent('')
      await load()
    } catch (caught) {
      Alert.alert(
        'Unable to add goal',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }
  const saveMonthlyBudget = async () => {
    if (!data || !user || !Number.isFinite(Number(budget)) || Number(budget) < 0)
      return Alert.alert('Check budget', 'Enter a valid monthly amount.')
    try {
      await saveBudget(data.coupleId, user.id, data.month, Number(budget))
      await load()
    } catch (caught) {
      Alert.alert(
        'Unable to save budget',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }
  const createBill = async () => {
    const amount = Number(billAmount)
    if (
      !data ||
      !user ||
      !billTitle.trim() ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(billDate)
    )
      return Alert.alert('Check bill details', 'Enter a title, amount, and due date as YYYY-MM-DD.')
    try {
      await addBill(data.coupleId, user.id, billTitle.trim(), amount, billDate, 'monthly')
      setBillTitle('')
      setBillAmount('')
      setBillDate('')
      await load()
    } catch (caught) {
      Alert.alert(
        'Unable to add bill',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }
  const streakCheckIn = async () => {
    if (!data) return
    try {
      const streak = await checkInStreak(data.coupleId)
      setData((current: any) => ({ ...current, streak }))
    } catch (caught) {
      Alert.alert(
        'Unable to check in',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }
  const generateIdeas = async () => {
    try {
      setIdeas(await getDateIdeas('happy', 'clear', 'nearby'))
    } catch (caught) {
      Alert.alert(
        'Date ideas unavailable',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>SHARED FINANCE</Text>
      <Text style={styles.title}>Money & connection</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.section}>Monthly budget · {data?.month ?? ''}</Text>
        <TextInput
          value={budget || String(data?.budget?.amount ?? '')}
          onChangeText={setBudget}
          placeholder="Budget (MMK)"
          placeholderTextColor="#8d8d99"
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.muted}>Spent this month: {mmk(spent)}</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, Number(data?.budget?.amount) ? (spent / Number(data.budget.amount)) * 100 : 0)}%`,
              },
            ]}
          />
        </View>
        <TouchableOpacity style={styles.primary} onPress={() => void saveMonthlyBudget()}>
          <Text style={styles.primaryText}>Save monthly budget</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Savings goals</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Goal name"
          placeholderTextColor="#8d8d99"
          style={styles.input}
        />
        <TextInput
          value={target}
          onChangeText={setTarget}
          placeholder="Target (MMK)"
          placeholderTextColor="#8d8d99"
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={current}
          onChangeText={setCurrent}
          placeholder="Current (MMK)"
          placeholderTextColor="#8d8d99"
          keyboardType="numeric"
          style={styles.input}
        />
        <TouchableOpacity style={styles.primary} onPress={() => void addGoal()}>
          <Text style={styles.primaryText}>Add goal</Text>
        </TouchableOpacity>
        {(data?.goals ?? []).map((goal: FinancialGoal) => (
          <View key={goal.id} style={styles.goal}>
            <View style={styles.row}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.muted}>
                {mmk(goal.current_amount)} / {mmk(goal.target_amount)}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.min(100, (goal.current_amount / goal.target_amount) * 100)}%` },
                ]}
              />
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.prompt('Add progress', 'Amount in MMK', async (value) => {
                  const amount = Number(value)
                  if (amount > 0) {
                    await addFinancialProgress(goal.id, goal.current_amount, amount)
                    await load()
                  }
                })
              }
            >
              <Text style={styles.link}>Add progress</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Bill reminders</Text>
        <TextInput
          value={billTitle}
          onChangeText={setBillTitle}
          placeholder="Bill name"
          placeholderTextColor="#8d8d99"
          style={styles.input}
        />
        <TextInput
          value={billAmount}
          onChangeText={setBillAmount}
          placeholder="Amount (MMK)"
          placeholderTextColor="#8d8d99"
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={billDate}
          onChangeText={setBillDate}
          placeholder="Due date YYYY-MM-DD"
          placeholderTextColor="#8d8d99"
          style={styles.input}
        />
        <TouchableOpacity style={styles.primary} onPress={() => void createBill()}>
          <Text style={styles.primaryText}>Add bill reminder</Text>
        </TouchableOpacity>
        {(data?.bills ?? []).map((bill: any) => (
          <Text key={bill.id} style={styles.muted}>
            {bill.title} · {mmk(bill.amount)} · due {bill.due_date}
          </Text>
        ))}
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Love streak 🔥 {data?.streak?.current_streak ?? 0} days</Text>
        <Text style={styles.muted}>Check in daily to keep your shared streak alive.</Text>
        <TouchableOpacity style={styles.secondary} onPress={() => void streakCheckIn()}>
          <Text style={styles.primaryText}>Daily check-in</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>AI date ideas</Text>
        <Text style={styles.muted}>Suggestions based on mood, weather, and nearby plans.</Text>
        <TouchableOpacity style={styles.primary} onPress={() => void generateIdeas()}>
          <Text style={styles.primaryText}>Suggest a date</Text>
        </TouchableOpacity>
        {ideas.map((idea, index) => (
          <Text key={index} style={styles.muted}>
            • {typeof idea === 'string' ? idea : (idea.title ?? idea.description)}
          </Text>
        ))}
      </View>
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#0f0f12', padding: 20, paddingTop: 72, gap: 14 },
  eyebrow: { color: '#d9bfd7', fontSize: 12, letterSpacing: 2 },
  title: { color: '#f3f0f5', fontSize: 30, fontWeight: '700' },
  section: { color: '#fff', fontSize: 18, fontWeight: '800' },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2d35',
    gap: 10,
  },
  input: {
    backgroundColor: '#0f0f12',
    borderRadius: 12,
    color: '#f3f0f5',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2d35',
  },
  primary: { backgroundColor: '#d8b9c8', padding: 13, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: '#0f0f12', fontWeight: '800' },
  secondary: { backgroundColor: '#ff6b81', padding: 13, borderRadius: 12, alignItems: 'center' },
  muted: { color: '#c4c4ce', lineHeight: 20 },
  error: { color: '#ff9b9b' },
  link: { color: '#ff9bba', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  goal: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2d35' },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  track: { height: 9, backgroundColor: '#2a2d35', borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#ff6b81' },
})
