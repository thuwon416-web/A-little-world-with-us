import { supabase } from '@/lib/supabase'

async function context() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error || !data?.couple_id) throw new Error('Link your partner before using shared features.')
  return { userId: user.id, coupleId: data.couple_id }
}

export async function getAdvancedData() {
  const { coupleId } = await context()
  const month = new Date().toISOString().slice(0, 7)
  const [budget, goals, bills, streak, expenses] = await Promise.all([
    supabase
      .from('monthly_budgets')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('month', month)
      .maybeSingle(),
    supabase
      .from('financial_goals')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false }),
    supabase.from('bill_reminders').select('*').eq('couple_id', coupleId).order('due_date'),
    supabase.from('love_streaks').select('*').eq('couple_id', coupleId).maybeSingle(),
    supabase
      .from('finance_expenses')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('spent_at', `${month}-01`)
      .order('spent_at'),
  ])
  for (const result of [budget, goals, bills, streak, expenses])
    if (result.error) throw new Error(result.error.message)
  return {
    coupleId,
    month,
    budget: budget.data,
    goals: goals.data ?? [],
    bills: bills.data ?? [],
    streak: streak.data,
    expenses: expenses.data ?? [],
  }
}

export async function saveBudget(coupleId: string, userId: string, month: string, amount: number) {
  const { error } = await supabase
    .from('monthly_budgets')
    .upsert({ couple_id: coupleId, user_id: userId, month, amount })
  if (error) throw new Error(error.message)
}

export async function addBill(
  coupleId: string,
  userId: string,
  title: string,
  amount: number,
  dueDate: string,
  repeat: string
) {
  const { error } = await supabase
    .from('bill_reminders')
    .insert({ couple_id: coupleId, user_id: userId, title, amount, due_date: dueDate, repeat })
  if (error) throw new Error(error.message)
}

export async function checkInStreak(coupleId: string) {
  const { data: current, error: readError } = await supabase
    .from('love_streaks')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle()
  if (readError) throw new Error(readError.message)
  const today = new Date().toISOString().slice(0, 10)
  if (current?.last_check_in?.slice(0, 10) === today) return current
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const next =
    current?.last_check_in?.slice(0, 10) === yesterday ? (current.current_streak ?? 0) + 1 : 1
  const { data, error } = await supabase
    .from('love_streaks')
    .upsert({ couple_id: coupleId, current_streak: next, last_check_in: new Date().toISOString() })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getDateIdeas(mood: string, weather: string, location: string) {
  const { data, error } = await supabase.functions.invoke('ai-date-ideas', {
    body: { mood, weather, location, language: 'my' },
  })
  if (error) throw new Error(error.message)
  return Array.isArray(data) ? data : (data?.ideas ?? [])
}
