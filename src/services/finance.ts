import { supabase } from '@/lib/supabase'
import type { FinancialGoal } from '@/shared-types'

export const financeService = {
  async getGoals(coupleId: string): Promise<FinancialGoal[]> {
    const { data, error } = await supabase.from('financial_goals').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as FinancialGoal[]
  },
  async createGoal(goal: Omit<FinancialGoal, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialGoal> {
    const { data, error } = await supabase.from('financial_goals').insert(goal).select().single()
    if (error) throw error
    return data as FinancialGoal
  },
}
