import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export type MoodValue = 'happy' | 'calm' | 'stressed' | 'sad' | 'excited' | 'tired'
export type CareType = 'water' | 'sleep' | 'meals' | 'exercise'

export interface MoodLog {
  id: string
  user_id: string
  mood: MoodValue
  note?: string | null
  created_at: string
}

export interface CareLog {
  id: string
  user_id: string
  type: CareType
  completed_at: string
}

export interface CycleLog {
  id: string
  user_id: string
  start_date: string
  end_date?: string | null
  cycle_length?: number | null
  created_at: string
}

const localUserId = 'local-user'

export async function logMood(mood: MoodValue, note?: string) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: localUserId,
      mood,
      note: note ?? null,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as MoodLog | null
}

export async function getMoodHistory(days = 7): Promise<MoodLog[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', localUserId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as MoodLog[]
}

export async function logCare(type: CareType) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('care_logs')
    .insert({ user_id: localUserId, type, completed_at: new Date().toISOString() })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CareLog | null
}

export async function getCareStats() {
  if (!isSupabaseConfigured) {
    return { total: 0, percentage: 0, completed: 0 }
  }

  const { data, error } = await supabase.from('care_logs').select('*').eq('user_id', localUserId)

  if (error) {
    throw new Error(error.message)
  }

  const records = (data ?? []) as CareLog[]
  const total = records.length
  const completed = total

  return {
    total,
    completed,
    percentage: total === 0 ? 0 : Math.min(100, Math.round((completed / Math.max(total, 1)) * 100)),
  }
}

export async function logCycle(startDate: string, endDate?: string, cycleLength?: number) {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('cycle_logs')
    .insert({
      user_id: localUserId,
      start_date: startDate,
      end_date: endDate ?? null,
      cycle_length: cycleLength ?? null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as CycleLog | null
}

export async function predictCycle() {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data, error } = await supabase
    .from('cycle_logs')
    .select('*')
    .eq('user_id', localUserId)
    .order('start_date', { ascending: false })
    .limit(3)

  if (error) {
    throw new Error(error.message)
  }

  const logs = (data ?? []) as CycleLog[]
  if (logs.length < 2) {
    return null
  }

  const recent = logs.slice(0, 2)
  const first = new Date(recent[1].start_date)
  const second = new Date(recent[0].start_date)
  const diffDays = Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24))

  if (Number.isNaN(diffDays) || diffDays <= 0) {
    return null
  }

  const predicted = new Date(second)
  predicted.setDate(predicted.getDate() + diffDays)
  return predicted.toISOString()
}
