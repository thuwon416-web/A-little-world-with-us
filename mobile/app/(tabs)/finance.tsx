import { Flame } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import AddExpenseModal from '@/features/finance/AddExpenseModal'
import CategoryFilter from '@/features/finance/CategoryFilter'
import ExpenseList from '@/features/finance/ExpenseList'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import {
  type AdvancedFinanceData,
  checkInStreak,
  type DateIdea,
  getAdvancedData,
  getDateIdeas,
  saveBudget,
  addBill,
} from '@/services/advanced'
import { addFinancialProgress, addFinancialGoal } from '@/services/finance'
import { deleteExpense, getExpenses, type Expense } from '@/services/finance-splitwise'

const mmk = (value: number) => `${Number(value).toLocaleString()} MMK`

export default function FinanceScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [data, setData] = useState<AdvancedFinanceData | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [splitExpenses, setSplitExpenses] = useState<Expense[]>([])
  const [expenseFilter, setExpenseFilter] = useState('all')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [budget, setBudget] = useState('')
  const [billTitle, setBillTitle] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billDate, setBillDate] = useState('')
  const [ideas, setIdeas] = useState<DateIdea[]>([])
  const [error, setError] = useState('')
  const loadSplitExpenses = async () => {
    if (!user?.id) return
    setLoadingExpenses(true)
    try {
      setSplitExpenses(await getExpenses())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load shared expenses.')
    } finally {
      setLoadingExpenses(false)
    }
  }
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
  useEffect(() => {
    void loadSplitExpenses()
  }, [user?.id])
  useEffect(() => {
    const loadPartner = async () => {
      if (!user?.id) return
      const { data: link } = await supabase
        .from('couple_links')
        .select('inviter_id, accepted_by')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()
      if (link) setPartnerId(link.inviter_id === user.id ? link.accepted_by : link.inviter_id)
    }
    void loadPartner()
  }, [user?.id])
  const spent = useMemo(
    () => (data?.expenses ?? []).reduce((sum, item) => sum + Number(item.amount), 0),
    [data]
  )
  const filteredExpenses = splitExpenses.filter(
    (expense) => expenseFilter === 'all' || expense.category === expenseFilter
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
      setData((current) => (current ? { ...current, streak } : current))
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

  const styles = useMemo(() => createStyles(colors, sizes), [colors, sizes])

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.eyebrow}>SHARED FINANCE</Text>
      <Text style={styles.title}>Money & connection</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.section}>Monthly budget · {data?.month ?? ''}</Text>
        <TextInput
          value={budget || String(data?.budget?.amount ?? '')}
          onChangeText={setBudget}
          placeholder="Budget (MMK)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.muted}>Spent this month: {mmk(spent)}</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, Number(data?.budget?.amount) ? (spent / Number(data?.budget?.amount)) * 100 : 0)}%`,
              },
            ]}
          />
        </View>
        <TouchableOpacity style={styles.primary} onPress={() => void saveMonthlyBudget()}>
          <Text style={styles.primaryText}>Save monthly budget</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.rowCentered}>
          <Text style={styles.section}>Shared Expenses</Text>
          <TouchableOpacity
            style={styles.primarySmall}
            onPress={() => setShowAddExpense(true)}
            disabled={!user?.id || !partnerId}
          >
            <Text style={styles.primaryText}>+ Add Expense</Text>
          </TouchableOpacity>
        </View>
        <CategoryFilter active={expenseFilter} onChange={setExpenseFilter} />
        {loadingExpenses ? (
          <Text style={styles.muted}>Loading expenses...</Text>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No expenses yet"
            description="Add one above to get started."
          />
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            currentUserId={user?.id ?? ''}
            partnerId={partnerId}
            onDelete={async (id) => {
              await deleteExpense(id)
              setSplitExpenses((previous) => previous.filter((expense) => expense.id !== id))
            }}
          />
        )}
      </View>
      <AddExpenseModal
        visible={showAddExpense}
        currentUserId={user?.id ?? ''}
        partnerId={partnerId}
        onClose={() => setShowAddExpense(false)}
        onSaved={() => {
          void loadSplitExpenses()
        }}
      />
      <View style={styles.card}>
        <Text style={styles.section}>Savings goals</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Goal name"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TextInput
          value={target}
          onChangeText={setTarget}
          placeholder="Target (MMK)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={current}
          onChangeText={setCurrent}
          placeholder="Current (MMK)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={styles.input}
        />
        <TouchableOpacity style={styles.primary} onPress={() => void addGoal()}>
          <Text style={styles.primaryText}>Add goal</Text>
        </TouchableOpacity>
        {(data?.goals ?? []).length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No savings goals yet"
            description="Add one above to start planning together."
          />
        ) : (
          <FlatList
            data={data?.goals ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item: goal }) => (
              <View style={styles.goal}>
                <View style={styles.row}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.muted}>
                    {mmk(Number(goal.current_amount))} / {mmk(Number(goal.target_amount))}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(
                          100,
                          (Number(goal.current_amount) / Number(goal.target_amount)) * 100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.prompt('Add progress', 'Amount in MMK', async (value) => {
                      const amount = Number(value)
                      if (amount > 0) {
                        await addFinancialProgress(goal.id, Number(goal.current_amount), amount)
                        await load()
                      }
                    })
                  }
                >
                  <Text style={styles.link}>Add progress</Text>
                </TouchableOpacity>
              </View>
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews
          />
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Bill reminders</Text>
        <TextInput
          value={billTitle}
          onChangeText={setBillTitle}
          placeholder="Bill name"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TextInput
          value={billAmount}
          onChangeText={setBillAmount}
          placeholder="Amount (MMK)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          value={billDate}
          onChangeText={setBillDate}
          placeholder="Due date YYYY-MM-DD"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TouchableOpacity style={styles.primary} onPress={() => void createBill()}>
          <Text style={styles.primaryText}>Add bill reminder</Text>
        </TouchableOpacity>
        {(data?.bills ?? []).length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No bills yet"
            description="Add a bill reminder above to stay on track."
          />
        ) : (
          <FlatList
            data={data?.bills ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item: bill }) => (
              <Text style={styles.muted}>
                {bill.title} · {mmk(Number(bill.amount))} · due {bill.due_date}
              </Text>
            )}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews
          />
        )}
      </View>
      <View style={styles.card}>
        <View style={styles.rowCentered}>
          <Text style={styles.section}>Love streak</Text>
          <Flame size={18} color={colors.accent1} />
        </View>
        <Text style={styles.muted}>{data?.streak?.current_streak ?? 0} days</Text>
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
        {ideas.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No ideas yet"
            description="Suggest a date to get ideas for your next outing."
          />
        ) : (
          ideas.map((idea, index) => (
            <Text key={index} style={styles.muted}>
              • {typeof idea === 'string' ? idea : (idea.title ?? idea.description)}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: colors.background, padding: 20, gap: 14 },
    eyebrow: { color: colors.textPrimary, fontSize: sizes.text.xs, letterSpacing: 2 },
    title: { color: colors.textPrimary, fontSize: sizes.text.hLg, fontWeight: '700' },
    section: { color: colors.textPrimary, fontSize: sizes.text.bodyLg, fontWeight: '800' },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: sizes.radius.card,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 10,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: sizes.radius.input,
      color: colors.textPrimary,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    primary: {
      backgroundColor: colors.accent2,
      padding: 13,
      borderRadius: sizes.radius.input,
      alignItems: 'center',
    },
    primarySmall: {
      backgroundColor: colors.accent1,
      padding: 10,
      borderRadius: sizes.radius.input,
    },
    primaryText: { color: colors.textPrimary, fontWeight: '800' },
    secondary: {
      backgroundColor: colors.accent1,
      padding: 13,
      borderRadius: sizes.radius.input,
      alignItems: 'center',
    },
    muted: { color: colors.textSecondary, lineHeight: 20 },
    error: { color: colors.error },
    link: { color: colors.accent2, fontWeight: '700' },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    rowCentered: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    goal: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder },
    goalTitle: { color: colors.textPrimary, fontSize: sizes.text.body, fontWeight: '700', flex: 1 },
    track: {
      height: 9,
      backgroundColor: colors.cardBorder,
      borderRadius: sizes.radius.input,
      overflow: 'hidden',
    },
    fill: { height: '100%', backgroundColor: colors.accent1 },
  })
