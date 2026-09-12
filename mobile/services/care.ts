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

export type CareLog = CareCheckIn & {
  id: string
  logDate: string
  periodDay: boolean
}

export type CareSettings = {
  coupleId: string
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
}

async function getActiveCareCoupleId(userId: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('couple_links')
    .select('couple_id')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`)
    .eq('status', 'accepted')
    .maybeSingle()
  if (error) throw error
  return data?.couple_id ?? undefined
}

export async function saveTodayCareLog(checkIn: CareCheckIn): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again to save your check-in.')

  const logDate = new Date().toISOString().slice(0, 10)
  const coupleId = await getActiveCareCoupleId(user.id)
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
        symptoms: checkIn.symptoms,
        period_day: checkIn.periodStarted ?? false,
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
    symptoms: checkIn.symptoms,
    period_day: checkIn.periodStarted ?? false,
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

export async function getCareData(): Promise<{
  logs: CareLog[]
  settings: CareSettings
  coupleId: string
  userId: string
}> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Please sign in again to view Care data.')
  const coupleId = await getActiveCareCoupleId(user.id)
  if (!coupleId) throw new Error('Accept a partner link before viewing shared Care data.')
  const [{ data: logs, error: logsError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase
        .from('care_daily_logs')
        .select('*')
        .eq('couple_id', coupleId)
        .order('log_date', { ascending: false }),
      supabase
        .from('care_cycle_settings')
        .select('couple_id,cycle_length,period_length,last_period_start')
        .eq('couple_id', coupleId)
        .maybeSingle(),
    ])
  if (logsError) throw logsError
  if (settingsError) throw settingsError
  return {
    userId: user.id,
    coupleId,
    logs: (logs ?? []).map((log) => ({
      id: log.id,
      logDate: log.log_date,
      periodDay: Boolean(log.period_day),
      mood: log.mood ?? undefined,
      symptoms: log.symptoms ?? [],
      sex: log.sex ?? [],
      discharge: log.discharge ?? [],
      digestion: log.digestion ?? [],
      pregnancyTest: log.pregnancy_test ?? [],
      ovulationTest: log.ovulation_test ?? undefined,
      contraceptives: log.contraceptives ?? [],
      waterIntake: log.water_intake ?? undefined,
      weight: log.weight ?? undefined,
      basalTemp: log.basal_temp ?? undefined,
      notes: log.notes ?? undefined,
      activities: log.activities ?? [],
      otherTags: log.other_tags ?? [],
    })),
    settings: {
      coupleId,
      cycleLength: settings?.cycle_length ?? 28,
      periodLength: settings?.period_length ?? 5,
      lastPeriodStart: settings?.last_period_start ?? null,
    },
  }
}

export async function saveCareSettings(settings: CareSettings) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Please sign in again.')
  const activeCoupleId = await getActiveCareCoupleId(user.id)
  if (!activeCoupleId || activeCoupleId !== settings.coupleId) {
    throw new Error('You can only update settings for your accepted couple.')
  }
  const { error } = await supabase.from('care_cycle_settings').upsert({
    couple_id: settings.coupleId,
    cycle_length: settings.cycleLength,
    period_length: settings.periodLength,
    last_period_start: settings.lastPeriodStart,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function saveCareLogForDate(
  coupleId: string,
  userId: string,
  logDate: string,
  checkIn: CareCheckIn
): Promise<void> {
  const activeCoupleId = await getActiveCareCoupleId(userId)
  if (!activeCoupleId || activeCoupleId !== coupleId) {
    throw new Error('You can only save Care data for your accepted couple.')
  }
  const { data: existing, error: lookupError } = await supabase
    .from('care_daily_logs')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('log_date', logDate)
    .maybeSingle()
  if (lookupError) throw lookupError
  const payload = {
    mood: checkIn.mood ?? null,
    symptoms: checkIn.symptoms,
    period_day: checkIn.periodStarted ?? false,
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
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }
  const request = existing
    ? supabase.from('care_daily_logs').update(payload).eq('id', existing.id)
    : supabase.from('care_daily_logs').insert({
        ...payload,
        couple_id: coupleId,
        user_id: userId,
        created_by: userId,
        log_date: logDate,
      })
  const { error } = await request
  if (error) throw error
}
