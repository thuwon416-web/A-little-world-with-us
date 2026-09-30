import { supabase } from '@/lib/supabase'
import type { CareDailyLog } from '@/shared-types'

export const careService = {
  async getDailyLogs(coupleId: string): Promise<CareDailyLog[]> {
    const { data, error } = await supabase.from('care_daily_logs').select('id, couple_id, user_id, log_date, period_day, mood, symptoms, sex, discharge, digestion, pregnancy_test, ovulation_test, contraceptives, water_intake, weight, basal_temp, notes, activities, other_tags, created_at, updated_at').eq('couple_id', coupleId).order('log_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as CareDailyLog[]
  },
  async createDailyLog(log: Omit<CareDailyLog, 'id' | 'created_at' | 'updated_at'>): Promise<CareDailyLog> {
    const { data, error } = await supabase.from('care_daily_logs').insert(log).select().single()
    if (error) throw error
    return data as CareDailyLog
  },
}
