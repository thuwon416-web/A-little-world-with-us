import { supabase } from '@/lib/supabase'
import type { CareDailyLog } from '@/shared-types'

export const careService = {
  async getDailyLogs(coupleId: string): Promise<CareDailyLog[]> {
    const { data, error } = await supabase.from('care_daily_logs').select('*').eq('couple_id', coupleId).order('log_date', { ascending: false })
    if (error) throw error
    return (data ?? []) as CareDailyLog[]
  },
  async createDailyLog(log: Omit<CareDailyLog, 'id' | 'created_at' | 'updated_at'>): Promise<CareDailyLog> {
    const { data, error } = await supabase.from('care_daily_logs').insert(log).select().single()
    if (error) throw error
    return data as CareDailyLog
  },
}
