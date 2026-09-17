import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native'

import { createExpense, type SplitType } from '@/services/finance-splitwise'
import { EXPENSE_CATEGORIES, SPLIT_TYPES } from './finance-constants'
import { useTheme } from '@/context/ThemeContext'

type AddExpenseModalProps = {
  visible: boolean
  currentUserId: string
  partnerId: string | null
  onClose: () => void
  onSaved: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export default function AddExpenseModal({ visible, currentUserId, partnerId, onClose, onSaved }: AddExpenseModalProps) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [spentAt, setSpentAt] = useState(today)
  const [paidBy, setPaidBy] = useState(currentUserId)
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [partnerPercentage, setPartnerPercentage] = useState('50')
  const [partnerExact, setPartnerExact] = useState('')
  const [yourShare, setYourShare] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    const parsedAmount = Number(amount)
    const percentage = Number(partnerPercentage)
    const exactPartner = Number(partnerExact)
    const exactYou = Number(yourShare)
    if (!title.trim()) return setError('Title is required.')
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError('Amount must be greater than zero.')
    if (!partnerId) return setError('An accepted partner is required.')
    if (splitType === 'percentage' && (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)) return setError("Partner's percentage must be between 0 and 100.")
    if (splitType === 'custom' && (!Number.isFinite(exactYou) || !Number.isFinite(exactPartner) || Math.abs(exactYou + exactPartner - parsedAmount) > 0.01)) return setError('Shares must add up to the total amount.')

    setSubmitting(true)
    setError('')
    try {
      await createExpense({
        title: title.trim(),
        amount: parsedAmount,
        category,
        spentAt,
        paidBy,
        splitType,
        splitWith: partnerId,
        splitPercentage: splitType === 'percentage' ? percentage : splitType === 'custom' ? (exactPartner / parsedAmount) * 100 : 50,
        notes: notes.trim() || null,
      })
      onSaved()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save expense.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Add expense">
      <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.textSecondary} style={styles.input} />
      <TextInput value={amount} onChangeText={setAmount} placeholder="Amount (MMK)" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.input} />
      <Text style={styles.label}>Category</Text>
      <View style={styles.pillRow}>{EXPENSE_CATEGORIES.map((item) => <TouchableOpacity key={item.value} onPress={() => setCategory(item.value)} style={[styles.pill, category === item.value && styles.activePill]}><Text style={category === item.value ? styles.activeText : styles.pillText}>{item.label}</Text></TouchableOpacity>)}</View>
      <TextInput value={spentAt} onChangeText={setSpentAt} placeholder="Date YYYY-MM-DD" placeholderTextColor={colors.textSecondary} style={styles.input} />
      <Text style={styles.label}>Paid by</Text>
      <View style={styles.pillRow}>
        <TouchableOpacity onPress={() => setPaidBy(currentUserId)} style={[styles.pill, paidBy === currentUserId && styles.activePill]}><Text style={paidBy === currentUserId ? styles.activeText : styles.pillText}>You</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => partnerId && setPaidBy(partnerId)} style={[styles.pill, paidBy === partnerId && styles.activePill]}><Text style={paidBy === partnerId ? styles.activeText : styles.pillText}>Partner</Text></TouchableOpacity>
      </View>
      <Text style={styles.label}>Split type</Text>
      <View style={styles.pillRow}>{SPLIT_TYPES.map((item) => <TouchableOpacity key={item.value} onPress={() => setSplitType(item.value)} style={[styles.pill, splitType === item.value && styles.activePill]}><Text style={splitType === item.value ? styles.activeText : styles.pillText}>{item.label}</Text></TouchableOpacity>)}</View>
      {splitType === 'percentage' ? <><TextInput value={partnerPercentage} onChangeText={setPartnerPercentage} placeholder="Partner percentage" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.input} /><Text style={styles.hint}>Your share: {100 - Number(partnerPercentage || 0)}%</Text></> : null}
      {splitType === 'custom' ? <View style={styles.shareRow}><TextInput value={yourShare} onChangeText={setYourShare} placeholder="Your share" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={[styles.input, styles.shareInput]} /><TextInput value={partnerExact} onChangeText={setPartnerExact} placeholder="Partner share" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={[styles.input, styles.shareInput]} /></View> : null}
      <TextInput value={notes} onChangeText={setNotes} placeholder="Notes (optional)" placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.notes]} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => void save()} disabled={submitting} style={styles.save}><Text style={styles.saveText}>{submitting ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  input: { backgroundColor: colors.background, borderRadius: 12, color: colors.textPrimary, padding: 11, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8 },
  label: { color: colors.textPrimary, fontWeight: '700', marginTop: 4, marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  pill: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  activePill: { backgroundColor: colors.accent1, borderColor: colors.accent1 },
  pillText: { color: colors.textSecondary, fontSize: 12 },
  activeText: { color: colors.background, fontSize: 12, fontWeight: '700' },
  hint: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  shareRow: { flexDirection: 'row', gap: 8 },
  shareInput: { flex: 1 },
  notes: { minHeight: 64, textAlignVertical: 'top' },
  error: { color: colors.error, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 5 },
  cancel: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  cancelText: { color: colors.textSecondary, fontWeight: '700' },
  save: { backgroundColor: colors.accent1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  saveText: { color: colors.background, fontWeight: '800' },
})
