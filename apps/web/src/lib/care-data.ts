import { supabase } from './supabase'

export type CareLog = {
  id: string; user_id: string; couple_id: string; log_date: string; period_day: boolean; mood: string | null; symptoms: string[]; sex: string[]; discharge: string[]; digestion: string[]; pregnancy_test: string[]; ovulation_test: string | null; contraceptives: string[]; other_pills: string[]; medication_taken: boolean | null; water_intake: number | null; weight: number | null; basal_temp: number | null; notes: string | null; activities: string[]; other_tags: string[]; updated_at: string; updated_by: string | null
}

export type CycleSettings = { couple_id: string; cycle_length: number; period_length: number; last_period_start: string | null; updated_at: string }
export type CareReminder = { id: string; couple_id: string; reminder_type: 'pms' | 'period' | 'fertile' | 'symptom'; enabled: boolean }
export type CareDraft = Omit<Partial<CareLog>, 'id' | 'user_id' | 'couple_id' | 'updated_at' | 'updated_by'> & { log_date: string }
export type CycleHistoryEntry = { startDate: string; endDate: string; length: number; status: 'actual' | 'predicted'; variationMin: number; variationMax: number }
export type FertilityStatus = 'higher' | 'lower' | 'uncertain'
export type CycleSummary = { cycleLength: number; periodLength: number; lastPeriodStart: string | null; nextPeriodStart: string | null; daysUntilPeriod: number | null; lateByDays: number; fertileStart: string | null; fertileEnd: string | null; ovulationDate: string | null; day: number | null; regular: boolean; estimateReady: boolean; variationMin: number; variationMax: number; fertilityStatus: FertilityStatus; cycleHistory: CycleHistoryEntry[] }

// Keep persisted calendar dates separate from timestamps so timezone offsets and DST
// cannot change the day used by cycle calculations.
export const dateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const parseDateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}
const utcDateKey = (date: Date) => `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
export const addDays = (value: string, amount: number) => {
  const date = parseDateOnly(value)
  if (!date || !Number.isInteger(amount)) throw new RangeError('A valid date and whole number of days are required.')
  return utcDateKey(new Date(date.getTime() + amount * 86400000))
}
const daysBetween = (start: string, end: string) => {
  const startDate = parseDateOnly(start)
  const endDate = parseDateOnly(end)
  if (!startDate || !endDate) throw new RangeError('Valid date-only values are required.')
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
}
const validPastDate = (value: string | null, today: string) =>
  value && parseDateOnly(value) && value <= today ? value : null
const validCycleLength = (value: number) =>
  Number.isInteger(value) && value >= 15 && value <= 60 ? value : 28
const medianCycleLength = (values: number[]) => {
  const ordered = [...values].sort((a, b) => a - b)
  const middle = Math.floor(ordered.length / 2)
  const median = ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2
  return Math.round(median)
}

export async function getAcceptedCareContext() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await supabase.from('couple_links').select('couple_id').or(`inviter_id.eq.${auth.user.id},accepted_by.eq.${auth.user.id}`).eq('status', 'accepted').maybeSingle()
  if (error) throw error
  return data?.couple_id ? { userId: auth.user.id, coupleId: data.couple_id } : null
}

export async function getCareLogs(coupleId: string) {
  const { data, error } = await supabase.from('care_daily_logs').select('*').eq('couple_id', coupleId).order('log_date', { ascending: false })
  if (error) throw error
  return (data ?? []) as CareLog[]
}

export async function getCycleSettings(coupleId: string): Promise<CycleSettings> {
  const { data, error } = await supabase.from('care_cycle_settings').select('*').eq('couple_id', coupleId).maybeSingle()
  if (error) throw error
  return (data as CycleSettings | null) ?? { couple_id: coupleId, cycle_length: 28, period_length: 5, last_period_start: null, updated_at: '' }
}

export async function saveCycleSettings(settings: Omit<CycleSettings, 'updated_at'>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in is required.')
  const { error } = await supabase.from('care_cycle_settings').upsert({ ...settings, updated_by: auth.user.id, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function getCareReminders(coupleId: string) {
  const { data, error } = await supabase.from('care_reminders').select('id,couple_id,reminder_type,enabled').eq('couple_id', coupleId)
  if (error) throw error
  return (data ?? []) as CareReminder[]
}

export async function saveCareReminder(coupleId: string, userId: string, reminderType: CareReminder['reminder_type'], enabled: boolean) {
  const { data: existing, error: lookupError } = await supabase.from('care_reminders').select('id').eq('couple_id', coupleId).eq('reminder_type', reminderType).maybeSingle()
  if (lookupError) throw lookupError
  const request = existing
    ? supabase.from('care_reminders').update({ enabled }).eq('id', existing.id)
    : supabase.from('care_reminders').insert({ couple_id: coupleId, user_id: userId, reminder_type: reminderType, enabled })
  const { error } = await request
  if (error) throw error
}

export async function saveCareLog(coupleId: string, userId: string, draft: CareDraft) {
  const { data: existing, error: lookupError } = await supabase.from('care_daily_logs').select('id').eq('couple_id', coupleId).eq('log_date', draft.log_date).maybeSingle()
  if (lookupError) throw lookupError
  const payload = { ...draft, updated_at: new Date().toISOString(), updated_by: userId }
  const request = existing ? supabase.from('care_daily_logs').update(payload).eq('id', existing.id) : supabase.from('care_daily_logs').insert({ ...payload, couple_id: coupleId, user_id: userId, created_by: userId })
  const { error } = await request
  if (error) throw error
}

// Saving period days used to call saveCareLog once for every selected day.
// Each call first looked up the row, then inserted or updated it, which made a
// long historical period selection feel stalled. This groups the work into at
// most three database requests and runs those requests together.
export async function savePeriodDates(coupleId: string, selectedDates: string[]) {
  const dates = [...new Set(selectedDates)].sort((a, b) => a.localeCompare(b))
  const { error } = await supabase.rpc('save_care_period_dates', {
    target_couple_id: coupleId,
    selected_dates: dates,
  })
  if (error) throw error
}

export function periodStarts(logs: CareLog[], today = dateKey(new Date())) {
  const days = [...new Set(logs
    .filter((log) => log.period_day && validPastDate(log.log_date, today))
    .map((log) => log.log_date))]
    .sort((a, b) => a.localeCompare(b))
  return days.filter((day, index) => index === 0 || daysBetween(days[index - 1], day) > 1).reverse()
}

export function calculateCycleSummary(logs: CareLog[], settings: CycleSettings, today = dateKey(new Date())): CycleSummary {
  const starts = periodStarts(logs, today)
  const historicalLengths = starts.slice(0, 6).flatMap((start, index) => { const older = starts[index + 1]; const length = older ? daysBetween(older, start) : 0; return length >= 15 && length <= 60 ? [length] : [] })
  // Use the median cycle length; when the middle falls between two whole days,
  // round to the nearest day so Web and Mobile share the same calendar estimate.
  const cycleLength = historicalLengths.length ? medianCycleLength(historicalLengths) : validCycleLength(settings.cycle_length)
  // Logged period starts are the source of truth; the manual setting is only a fallback.
  const lastPeriodStart = starts[0] ?? validPastDate(settings.last_period_start, today)
  const variationMin = historicalLengths.length ? Math.min(...historicalLengths) : cycleLength
  const variationMax = historicalLengths.length ? Math.max(...historicalLengths) : cycleLength
  const variation = variationMax - variationMin
  const regular = variation <= 7
  const estimateReady = historicalLengths.length >= 2 && regular
  const actualHistory: CycleHistoryEntry[] = starts.slice(0, 6).flatMap((start, index) => {
    const older = starts[index + 1]
    const length = older ? daysBetween(older, start) : 0
    return older && length >= 15 && length <= 60 ? [{ startDate: older, endDate: addDays(start, -1), length, status: 'actual' as const, variationMin, variationMax }] : []
  }).reverse()
  if (!lastPeriodStart) return { cycleLength, periodLength: settings.period_length, lastPeriodStart: null, nextPeriodStart: null, daysUntilPeriod: null, lateByDays: 0, fertileStart: null, fertileEnd: null, ovulationDate: null, day: null, regular, estimateReady: false, variationMin, variationMax, fertilityStatus: 'uncertain', cycleHistory: actualHistory }
  const nextPeriodStart = addDays(lastPeriodStart, cycleLength)
  // Keep the primary fertile estimate tied to the current predicted cycle,
  // rather than stretching it from the historical min/max cycle lengths.
  // This gives a stable seven-day window (5 days before ovulation through
  // the day after) while cycle variability is surfaced separately as a warning.
  const daysUntilPeriod = daysBetween(today, nextPeriodStart)
  const cycleDay = daysBetween(lastPeriodStart, today)
  const lateByDays = estimateReady && cycleDay > variationMax ? cycleDay - variationMax : 0
  const hasCurrentFertilityEstimate = estimateReady && today < nextPeriodStart
  const ovulationDate = hasCurrentFertilityEstimate ? addDays(nextPeriodStart, -14) : null
  const fertileStart = ovulationDate ? addDays(ovulationDate, -5) : null
  const fertileEnd = ovulationDate ? addDays(ovulationDate, 1) : null
  const fertilityStatus: FertilityStatus = !hasCurrentFertilityEstimate
    ? 'uncertain'
    : today >= fertileStart! && today <= fertileEnd!
      ? 'higher'
      : 'lower'
  const cycleHistory = [...actualHistory, { startDate: lastPeriodStart, endDate: addDays(nextPeriodStart, -1), length: cycleLength, status: 'predicted' as const, variationMin, variationMax }]
  return { cycleLength, periodLength: settings.period_length, lastPeriodStart, nextPeriodStart, daysUntilPeriod, lateByDays, fertileStart, fertileEnd, ovulationDate, day: Math.max(1, cycleDay + 1), regular, estimateReady, variationMin, variationMax, fertilityStatus, cycleHistory }
}

export function getFertilityLabel(summary: CycleSummary) {
  if (summary.fertilityStatus === 'higher') return 'Higher estimated chance of pregnancy'
  if (summary.fertilityStatus === 'lower') return 'Lower estimated chance of pregnancy'
  return 'Pregnancy chance estimate unavailable'
}

export function getPeriodForecastLabel(summary: CycleSummary) {
  if (summary.daysUntilPeriod === null) return 'Log a period to begin forecasting.'
  if (summary.daysUntilPeriod > 0) return `Period in ${summary.daysUntilPeriod} day${summary.daysUntilPeriod === 1 ? '' : 's'}`
  if (summary.daysUntilPeriod === 0) return 'Period expected today'
  if (summary.lateByDays > 0) return `Period later than your usual range by ${summary.lateByDays} day${summary.lateByDays === 1 ? '' : 's'}`
  return 'Period estimate passed'
}

// Backward-compatible exports retained while older Care widgets are retired.
// These widgets are progressively being replaced by the shared Care experience;
// their optional fields intentionally describe the older, smaller form.
export type DailyLog = {
  id?: string
  user_id: string
  couple_id?: string
  log_date: string
  mood?: string
  symptoms?: string[]
  sex?: string[]
  medication_taken?: boolean
  water_intake?: number
  weight?: number
  temperature?: number
  notes?: string
  ovulation_test?: string
  activities?: string[]
  other_tags?: string[]
}
export type CycleData = { last_period_start: string | null; average_cycle_length: number; average_period_length: number; next_period_start: string | null; fertile_window_start: string | null; fertile_window_end: string | null; ovulation_date: string | null }
export async function getActiveCareCoupleLinkId(userId: string) { const context = await getAcceptedCareContext(); return context?.userId === userId ? context.coupleId : undefined }
export async function getDailyLogs(_userId: string, startDate?: string, endDate?: string) { const context = await getAcceptedCareContext(); if (!context) return []; const logs = await getCareLogs(context.coupleId); return logs.filter((log) => (!startDate || log.log_date >= startDate) && (!endDate || log.log_date <= endDate)) }
export async function getCurrentMonthLogs(userId: string) { const now = new Date(); return getDailyLogs(userId, dateKey(new Date(now.getFullYear(), now.getMonth(), 1)), dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0))) }
export async function getLatestLog(userId: string) { const logs = await getDailyLogs(userId); return logs[0] ?? null }
export async function getTodayLog(userId: string) { return (await getDailyLogs(userId, dateKey(new Date()), dateKey(new Date())))[0] ?? null }
export function calculateCycleData(logs: CareLog[]): CycleData { const summary = calculateCycleSummary(logs, { couple_id: '', cycle_length: 28, period_length: 5, last_period_start: null, updated_at: '' }); return { last_period_start: summary.lastPeriodStart, average_cycle_length: summary.cycleLength, average_period_length: summary.periodLength, next_period_start: summary.nextPeriodStart, fertile_window_start: summary.fertileStart, fertile_window_end: summary.fertileEnd, ovulation_date: summary.ovulationDate } }
export async function saveDailyLog(log: DailyLog) {
  const coupleId = await getActiveCareCoupleLinkId(log.user_id)
  if (!coupleId) throw new Error('An accepted partner link is required.')
  return saveCareLog(coupleId, log.user_id, {
    log_date: log.log_date,
    mood: log.mood ?? null,
    symptoms: log.symptoms ?? [],
    sex: log.sex ?? [],
    medication_taken: log.medication_taken ?? null,
    water_intake: log.water_intake ?? null,
    weight: log.weight ?? null,
    basal_temp: log.temperature ?? null,
    notes: log.notes ?? null,
    ovulation_test: log.ovulation_test ?? null,
    activities: log.activities ?? [],
    other_tags: log.other_tags ?? [],
  })
}
