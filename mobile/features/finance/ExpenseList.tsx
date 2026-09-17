import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { Expense } from '@/services/finance-splitwise'
import { SPLIT_TYPES } from './finance-constants'
import { useTheme } from '@/context/ThemeContext'

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
  const { colors } = useTheme()
  const styles = createStyles(colors)
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

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 },
  emoji: { fontSize: 24, width: 34, textAlign: 'center' },
  details: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  meta: { color: colors.textSecondary, fontSize: 12 },
  settled: { color: colors.success, backgroundColor: `${colors.success}26`, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, fontWeight: '700' },
  amountColumn: { alignItems: 'flex-end', gap: 5 },
  amount: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  delete: { color: colors.error, fontSize: 11, fontWeight: '700' },
  empty: { color: colors.textSecondary, paddingVertical: 8 },
})
