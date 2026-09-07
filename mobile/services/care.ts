import { supabase } from '@/lib/supabase'

export type CareCheckIn = {
  mood?: string
  symptoms: string[]
  sex?: string[]
  discharge?: string[]
  digestion?: string[]
  pregnancyTest?: string[]
  ovulationTest?: string
  contraceptives?: string[]
  waterIntake?: number
  weight?: number
  basalTemp?: number
  notes?: string
  otherTags?: string[]
  activities?: string[]
  periodStarted?: boolean
}

async function getActiveCareCoupleLinkId(userId: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('couple_links')
    .select('id')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error) throw error
  return data?.id
}

export async function saveTodayCareLog(checkIn: CareCheckIn) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again to save your check-in.')

  const logDate = new Date().toISOString().slice(0, 10)
  const nextSymptoms = checkIn.periodStarted ? [...new Set([...checkIn.symptoms, 'Period started'])] : checkIn.symptoms
  const coupleId = await getActiveCareCoupleLinkId(user.id)
  if (!coupleId) throw new Error('Accept a partner link before saving shared Care data.')
  const { data: existing, error: readError } = await supabase
    .from('care_daily_logs')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('log_date', logDate)
    .maybeSingle()

  if (readError) throw readError

  if (existing) {
    const { error } = await supabase
      .from('care_daily_logs')
      .update({
        mood: checkIn.mood ?? null,
        symptoms: nextSymptoms,
        sex: checkIn.sex ?? [],
        discharge: checkIn.discharge ?? [],
        digestion: checkIn.digestion ?? [],
        pregnancy_test: checkIn.pregnancyTest ?? [],
        ovulation_test: checkIn.ovulationTest ?? null,
        contraceptives: checkIn.contraceptives ?? [],
        water_intake: checkIn.waterIntake ?? 0,
        weight: checkIn.weight ?? null,
        basal_temp: checkIn.basalTemp ?? null,
        notes: checkIn.notes ?? null,
        other_tags: checkIn.otherTags ?? [],
        activities: checkIn.activities ?? [],
        couple_id: coupleId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('care_daily_logs').insert({
    user_id: user.id,
    couple_id: coupleId ?? null,
    log_date: logDate,
    symptoms: nextSymptoms,
    mood: checkIn.mood ?? null,
    sex: checkIn.sex ?? [],
    discharge: checkIn.discharge ?? [],
    digestion: checkIn.digestion ?? [],
    pregnancy_test: checkIn.pregnancyTest ?? [],
    ovulation_test: checkIn.ovulationTest ?? null,
    contraceptives: checkIn.contraceptives ?? [],
    water_intake: checkIn.waterIntake ?? 0,
    weight: checkIn.weight ?? null,
    basal_temp: checkIn.basalTemp ?? null,
    notes: checkIn.notes ?? null,
    other_tags: checkIn.otherTags ?? [],
    activities: checkIn.activities ?? [],
  })
  if (error) throw error
}
