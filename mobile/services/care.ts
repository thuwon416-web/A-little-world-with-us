import { supabase } from '@/lib/supabase'

export async function saveTodayCareLog(symptoms: string[], periodStarted = false) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again to save your check-in.')

  const logDate = new Date().toISOString().slice(0, 10)
  const nextSymptoms = periodStarted ? [...new Set([...symptoms, 'Period started'])] : symptoms
  const { data: existing, error: readError } = await supabase
    .from('care_daily_logs')
    .select('id, symptoms')
    .eq('user_id', user.id)
    .eq('log_date', logDate)
    .maybeSingle()

  if (readError) throw readError

  if (existing) {
    const { error } = await supabase
      .from('care_daily_logs')
      .update({ symptoms: nextSymptoms, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('care_daily_logs').insert({
    user_id: user.id,
    log_date: logDate,
    symptoms: nextSymptoms,
  })
  if (error) throw error
}
