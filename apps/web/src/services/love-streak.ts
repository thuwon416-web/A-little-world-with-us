import { supabase } from '@/lib/supabase'

export interface LoveStreakData {
  current_streak: number
  last_check_in: string | null
  checkedInToday: boolean
}

const localDateKey = (value: Date) => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getLoveStreak(coupleId: string): Promise<LoveStreakData> {
  const { data, error } = await supabase
    .from('love_streaks')
    .select('current_streak, last_check_in')
    .eq('couple_id', coupleId)
    .maybeSingle()

  if (error) {
    console.warn('Error fetching love streak:', error.message)
    return { current_streak: 0, last_check_in: null, checkedInToday: false }
  }

  const todayKey = localDateKey(new Date())
  const lastCheckInKey = data?.last_check_in ? localDateKey(new Date(data.last_check_in)) : null
  const checkedInToday = lastCheckInKey === todayKey

  return {
    current_streak: data?.current_streak ?? 0,
    last_check_in: data?.last_check_in ?? null,
    checkedInToday,
  }
}

export async function checkInLoveStreak(coupleId: string): Promise<LoveStreakData> {
  const { data: current } = await supabase
    .from('love_streaks')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle()

  const today = new Date()
  const todayKey = localDateKey(today)
  const currentCheckInKey = current?.last_check_in
    ? localDateKey(new Date(current.last_check_in))
    : null

  if (currentCheckInKey === todayKey) {
    return {
      current_streak: current?.current_streak ?? 1,
      last_check_in: current?.last_check_in ?? today.toISOString(),
      checkedInToday: true,
    }
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = localDateKey(yesterday)
  const nextStreak = currentCheckInKey === yesterdayKey ? (current.current_streak ?? 0) + 1 : 1

  const { data, error } = await supabase
    .from('love_streaks')
    .upsert({
      couple_id: coupleId,
      current_streak: nextStreak,
      last_check_in: today.toISOString(),
      updated_at: today.toISOString(),
    })
    .select('current_streak, last_check_in')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    current_streak: data.current_streak,
    last_check_in: data.last_check_in,
    checkedInToday: true,
  }
}
