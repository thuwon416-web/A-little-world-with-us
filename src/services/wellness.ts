import { supabase } from '@/lib/supabase'

export type WellnessLog = {
  id: string
  user_id: string
  activity_type: 'workout' | 'quest' | 'game'
  activity_id: string
  completed_at: string
}

export async function logWellnessActivity(userId: string, activityId: string) {
  const { data, error } = await supabase
    .from('wellness_logs')
    .insert({ user_id: userId, activity_type: 'workout', activity_id: activityId })
    .select()
    .single()
  if (error) throw error
  return data as WellnessLog
}

export async function getWellnessHistory(userId: string) {
  const { data, error } = await supabase
    .from('wellness_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WellnessLog[]
}
