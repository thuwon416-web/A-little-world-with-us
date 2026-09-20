import { supabase } from '@/lib/supabase'

/**
 * Finance math helpers - use integer arithmetic for MMK (Myanmar Kyat)
 * MMK has 0 decimals (no cents), so amounts are stored as integers.
 * Math.round() ensures no floating-point precision errors.
 */

function roundToInteger(amount: number): number {
  return Math.round(amount)
}

export type SplitType = 'equal' | 'percentage' | 'custom'

export type Expense = {
  id: string
  coupleId: string
  userId: string
  title: string
  amount: number
  spentAt: string
  category: string
  paidBy: string | null
  splitType: SplitType
  splitWith: string | null
  splitPercentage: number | null
  isSettled: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Settlement = {
  id: string
  coupleId: string
  fromUser: string
  toUser: string
  amount: number
  notes: string | null
  settledAt: string
  createdAt: string
}

export type BalanceSummary = {
  netBalance: number
  theyOweYou: number
  youOweThem: number
  totalExpenses: number
  expensesCount: number
  settlementsCount: number
}

export type CreateExpenseInput = {
  title: string
  amount: number
  spentAt?: string
  category?: string
  paidBy?: string | null
  splitType?: SplitType
  splitWith?: string | null
  splitPercentage?: number | null
  notes?: string | null
}

export type UpdateExpenseInput = Partial<CreateExpenseInput> & {
  isSettled?: boolean
}

export type CreateSettlementInput = {
  fromUser: string
  toUser: string
  amount: number
  notes?: string | null
  settledAt?: string
}

type ExpenseRow = {
  id: string
  couple_id: string
  user_id: string
  title: string
  amount: number | string
  spent_at: string
  category: string
  paid_by: string | null
  split_type: SplitType
  split_with: string | null
  split_percentage: number | string | null
  is_settled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

type SettlementRow = {
  id: string
  couple_id: string
  from_user: string
  to_user: string
  amount: number | string
  notes: string | null
  settled_at: string
  created_at: string
}

async function getContext() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.couple_id) throw new Error('No accepted couple is linked to this account.')
  return { userId: user.id, coupleId: data.couple_id }
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    coupleId: row.couple_id,
    userId: row.user_id,
    title: row.title,
    amount: Number(row.amount),
    spentAt: row.spent_at,
    category: row.category,
    paidBy: row.paid_by,
    splitType: row.split_type,
    splitWith: row.split_with,
    splitPercentage: row.split_percentage === null ? null : Number(row.split_percentage),
    isSettled: row.is_settled,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    coupleId: row.couple_id,
    fromUser: row.from_user,
    toUser: row.to_user,
    amount: Number(row.amount),
    notes: row.notes,
    settledAt: row.settled_at,
    createdAt: row.created_at,
  }
}

export async function getExpenses(): Promise<Expense[]> {
  const { coupleId } = await getContext()
  const { data, error } = await supabase
    .from('finance_expenses')
    .select('*')
    .eq('couple_id', coupleId)
    .order('spent_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as ExpenseRow[]).map(mapExpense)
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { userId, coupleId } = await getContext()
  const { data, error } = await supabase
    .from('finance_expenses')
    .insert({
      couple_id: coupleId,
      user_id: userId,
      title: input.title,
      amount: roundToInteger(input.amount),
      spent_at: input.spentAt,
      category: input.category ?? 'other',
      paid_by: input.paidBy ?? userId,
      split_type: input.splitType ?? 'equal',
      split_with: input.splitWith ?? null,
      split_percentage: input.splitPercentage ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapExpense(data as ExpenseRow)
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<void> {
  const { coupleId } = await getContext()
  const updates: Record<string, unknown> = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.amount !== undefined) updates.amount = roundToInteger(input.amount)
  if (input.spentAt !== undefined) updates.spent_at = input.spentAt
  if (input.category !== undefined) updates.category = input.category
  if (input.paidBy !== undefined) updates.paid_by = input.paidBy
  if (input.splitType !== undefined) updates.split_type = input.splitType
  if (input.splitWith !== undefined) updates.split_with = input.splitWith
  if (input.splitPercentage !== undefined) updates.split_percentage = input.splitPercentage
  if (input.isSettled !== undefined) updates.is_settled = input.isSettled
  if (input.notes !== undefined) updates.notes = input.notes
  if (Object.keys(updates).length === 0) return

  const { error } = await supabase
    .from('finance_expenses')
    .update(updates)
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw new Error(error.message)
}

export async function deleteExpense(id: string): Promise<void> {
  const { coupleId } = await getContext()
  const { error } = await supabase
    .from('finance_expenses')
    .delete()
    .eq('id', id)
    .eq('couple_id', coupleId)
  if (error) throw new Error(error.message)
}

export async function markSettled(id: string): Promise<void> {
  await updateExpense(id, { isSettled: true })
}

export async function getSettlements(): Promise<Settlement[]> {
  const { coupleId } = await getContext()
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('couple_id', coupleId)
    .order('settled_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as SettlementRow[]).map(mapSettlement)
}

export async function createSettlement(input: CreateSettlementInput): Promise<Settlement> {
  const { userId, coupleId } = await getContext()
  if (input.fromUser !== userId) throw new Error('A settlement must be created by its payer.')
  if (input.fromUser === input.toUser) throw new Error('A settlement must have two different people.')

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      couple_id: coupleId,
      from_user: input.fromUser,
      to_user: input.toUser,
      amount: roundToInteger(input.amount),
      notes: input.notes ?? null,
      settled_at: input.settledAt,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapSettlement(data as SettlementRow)
}

export function calculateBalance(
  expenses: Expense[],
  settlements: Settlement[],
  myUserId: string,
  partnerUserId: string
): BalanceSummary {
  let netBalance = 0
  let totalExpenses = 0
  let expensesCount = 0

  for (const expense of expenses) {
    const amount = roundToInteger(expense.amount)
    totalExpenses += amount
    expensesCount += 1
    if (expense.isSettled || !expense.paidBy || ![myUserId, partnerUserId].includes(expense.paidBy)) continue
    if (expense.splitWith === myUserId || expense.splitWith === partnerUserId) continue

    const share = expense.splitType === 'percentage'
      ? Math.round(amount * (expense.splitPercentage ?? 50) / 100)
      : Math.round(amount / 2)
    netBalance += expense.paidBy === myUserId ? share : -share
  }

  for (const settlement of settlements) {
    const amount = roundToInteger(settlement.amount)
    if (settlement.fromUser === myUserId && settlement.toUser === partnerUserId) netBalance -= amount
    if (settlement.fromUser === partnerUserId && settlement.toUser === myUserId) netBalance += amount
  }

  return {
    netBalance,
    theyOweYou: Math.max(0, netBalance),
    youOweThem: Math.max(0, -netBalance),
    totalExpenses,
    expensesCount,
    settlementsCount: settlements.length,
  }
}
