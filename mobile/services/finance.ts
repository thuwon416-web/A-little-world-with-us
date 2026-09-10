import { supabase } from '@/lib/supabase'

export type FinancialGoal = {
  id: string
  title: string
  target_amount: number
  current_amount: number
  created_at: string
}

async function getContext() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  const { data, error } = await supabase.from('couple_links').select('couple_id')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`).eq('status', 'accepted').maybeSingle()
  if (error || !data?.couple_id) throw new Error('No accepted couple is linked to this account.')
  return { userId: user.id, coupleId: data.couple_id }
}

export async function getFinancialGoals() {
  const { coupleId } = await getContext()
  const { data, error } = await supabase.from('financial_goals').select('id,title,target_amount,current_amount,created_at')
    .eq('couple_id', coupleId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as FinancialGoal[]
}

export async function addFinancialGoal(input: { title: string; targetAmount: number; currentAmount: number }) {
  const { userId, coupleId } = await getContext()
  const { error } = await supabase.from('financial_goals').insert({
    user_id: userId, couple_id: coupleId, title: input.title,
    target_amount: input.targetAmount, current_amount: input.currentAmount,
  })
  if (error) throw new Error(error.message)
}

export async function addFinancialProgress(id: string, currentAmount: number, amount: number) {
  const { error } = await supabase.from('financial_goals').update({ current_amount: currentAmount + amount }).eq('id', id)
  if (error) throw new Error(error.message)
}
