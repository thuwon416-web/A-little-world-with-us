import { supabase } from './supabase'

export interface DailyLog {
  id?: string
  user_id: string
  couple_id?: string
  log_date: string // ISO date
  mood?: string
  symptoms?: string[]
  sex?: string[]
  medication_taken?: boolean
  water_intake?: number
  weight?: number
  temperature?: number
  notes?: string
  ovulation_test?: 'Positive' | 'Negative' | 'Did not take'
  activities?: string[]
  other_tags?: string[]
}

export interface CycleData {
  last_period_start: string | null
  average_cycle_length: number
  average_period_length: number
  next_period_start: string | null
  fertile_window_start: string | null
  fertile_window_end: string | null
  ovulation_date: string | null
}

/**
 * Save daily log to Supabase
 */
export async function saveDailyLog(log: DailyLog) {
  try {
    const { data, error } = await supabase
      .from('care_daily_logs')
      .upsert({
        ...log,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving daily log:', error)
    throw error
  }
}

/**
 * Fetch daily logs for a user
 */
export async function getDailyLogs(userId: string, startDate?: string, endDate?: string) {
  try {
    let query = supabase
      .from('care_daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })

    if (startDate) {
      query = query.gte('log_date', startDate)
    }
    if (endDate) {
      query = query.lte('log_date', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching daily logs:', error)
    return []
  }
}

/**
 * Get latest daily log for a user
 */
export async function getLatestLog(userId: string) {
  try {
    const { data, error } = await supabase
      .from('care_daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data || null
  } catch (error) {
    console.error('Error fetching latest log:', error)
    return null
  }
}

/**
 * Calculate cycle data from logs
 */
export function calculateCycleData(logs: DailyLog[]): CycleData {
  // Filter logs with period start
  const periodLogs = logs.filter(log =>
    log.symptoms?.includes('Period started') ||
    log.other_tags?.includes('Period start')
  )

  if (periodLogs.length === 0) {
    // No period data, return defaults
    return {
      last_period_start: null,
      average_cycle_length: 28,
      average_period_length: 5,
      next_period_start: null,
      fertile_window_start: null,
      fertile_window_end: null,
      ovulation_date: null,
    }
  }

  // Sort by date
  periodLogs.sort((a, b) =>
    new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  )

  const lastPeriodStart = periodLogs[0].log_date

  // Calculate average cycle length from last 3 cycles
  const cycleLengths: number[] = []
  for (let i = 1; i < Math.min(periodLogs.length, 4); i++) {
    const daysBetween = Math.floor(
      (new Date(periodLogs[i - 1].log_date).getTime() -
       new Date(periodLogs[i].log_date).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    if (daysBetween > 0 && daysBetween < 60) {
      cycleLengths.push(daysBetween)
    }
  }

  const averageCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : 28

  const averagePeriodLength = 5 // Default

  // Calculate next period
  const lastPeriodDate = new Date(lastPeriodStart)
  const nextPeriodDate = new Date(lastPeriodDate)
  nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycleLength)

  // Calculate fertile window (14 days before next period, 5-day window)
  const ovulationDate = new Date(nextPeriodDate)
  ovulationDate.setDate(ovulationDate.getDate() - 14)

  const fertileWindowStart = new Date(ovulationDate)
  fertileWindowStart.setDate(fertileWindowStart.getDate() - 2)

  const fertileWindowEnd = new Date(ovulationDate)
  fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 2)

  return {
    last_period_start: lastPeriodStart,
    average_cycle_length: averageCycleLength,
    average_period_length: averagePeriodLength,
    next_period_start: nextPeriodDate.toISOString().split('T')[0],
    fertile_window_start: fertileWindowStart.toISOString().split('T')[0],
    fertile_window_end: fertileWindowEnd.toISOString().split('T')[0],
    ovulation_date: ovulationDate.toISOString().split('T')[0],
  }
}

/**
 * Get today's log
 */
export async function getTodayLog(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const logs = await getDailyLogs(userId, today, today)
  return logs.length > 0 ? logs[0] : null
}

/**
 * Get logs for current month
 */
export async function getCurrentMonthLogs(userId: string) {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return getDailyLogs(userId, startDate, endDate)
}
