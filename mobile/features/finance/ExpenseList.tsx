import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { Expense } from '@/services/finance-splitwise'
import { SPLIT_TYPES } from './finance-constants'

type ExpenseListProps = {
  expenses: Expense[]
  currentUserId: string
  partnerId: string | null
  onDelete: (id: string) => void
}

const CATEGORY_EMOJIS: Record<string, string> = {
  food: '🍔',
  travel: '✈️',
  bills: '🧾',
  entertainment: '🎬',
  shopping: '🛍️',
  health: '💊',
  other: '⭕',
}

const formatMmk = (amount: number) => `${amount.toLocaleString()} MMK`

export default function ExpenseList({ expenses, currentUserId, partnerId, onDelete }: ExpenseListProps) {
  if (!expenses.length) return <Text style={styles.empty}>No expenses yet. Add your first one.</Text>

  return (
    <View style={styles.list}>
      {expenses.map((expense) => {
        const paidBy = expense.paidBy === currentUserId ? 'Paid by You' : expense.paidBy === partnerId ? 'Paid by Partner' : 'Paid by Unknown'
        const splitLabel = SPLIT_TYPES.find((item) => item.value === expense.splitType)?.label ?? expense.splitType
        return (
          <View key={expense.id} style={styles.card}>
            <Text style={styles.emoji}>{CATEGORY_EMOJIS[expense.category] ?? CATEGORY_EMOJIS.other}</Text>
            <View style={styles.details}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
                {expense.isSettled ? <Text style={styles.settled}>Settled</Text> : null}
              </View>
              <Text style={styles.meta}>{paidBy} · {expense.spentAt} · {splitLabel}</Text>
            </View>
            <View style={styles.amountColumn}>
              <Text style={styles.amount}>{formatMmk(expense.amount)}</Text>
              {expense.userId === currentUserId ? (
                <TouchableOpacity onPress={() => onDelete(expense.id)} accessibilityLabel={`Delete ${expense.title}`}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#171b22', borderRadius: 14, borderWidth: 1, borderColor: '#2a2d35', padding: 12 },
  emoji: { fontSize: 24, width: 34, textAlign: 'center' },
  details: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { color: '#c4c4ce', fontSize: 12 },
  settled: { color: '#78e0a0', backgroundColor: 'rgba(120,224,160,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: '700' },
  amountColumn: { alignItems: 'flex-end', gap: 5 },
  amount: { color: '#fff', fontSize: 13, fontWeight: '700' },
  delete: { color: '#ff9b9b', fontSize: 11, fontWeight: '700' },
  empty: { color: '#c4c4ce', paddingVertical: 8 },
})
