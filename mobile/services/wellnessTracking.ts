import { supabase } from '@/lib/supabase'

export type WellnessLog = {
  id: string
  user_id: string
  activity_type: string
  activity_id: string
  completed_at: string
}

export async function getWellnessLogs(userId: string): Promise<WellnessLog[]> {
  const { data, error } = await supabase
    .from('wellness_logs')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(50)
  if (error) throw new Error(error.message)
  return (data ?? []) as WellnessLog[]
}

export async function logWellnessActivity(
  userId: string,
  activityType: 'workout' | 'quest' | 'game',
  activityId: string
) {
  const { data, error } = await supabase
    .from('wellness_logs')
    .insert({ user_id: userId, activity_type: activityType, activity_id: activityId })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as WellnessLog
}

export async function getResetAdvice(category: string, mood: string) {
  const { data, error } = await supabase.functions.invoke('ai-wellness-advice', {
    body: { category, mood },
  })
  if (error) throw new Error(error.message)
  const advice = typeof data === 'string' ? data : data?.advice
  return (
    advice ||
    'Take one gentle step: breathe slowly, name what you need, and share it with your partner.'
  )
}
