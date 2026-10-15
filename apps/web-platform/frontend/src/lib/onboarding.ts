import { supabase } from './supabase'

export type OnboardingData = {
  name?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  blood_type?: string
  height_cm?: number
  weight_kg?: number
  last_period_date?: string
  cycle_length?: number
  notifications_enabled?: boolean
  location_consent?: boolean
}

export type OnboardingProgress = {
  user_id: string
  data: OnboardingData & { current_step?: number; completed_steps?: number[]; is_completed?: boolean; completed_at?: string }
  updated_at: string
}

const STEPS = 6

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  return user
}

async function currentCoupleId(userId: string) {
  const { data, error } = await supabase.from('couple_links').select('couple_id')
    .or(`inviter_id.eq.${userId},accepted_by.eq.${userId}`).eq('status', 'accepted').maybeSingle()
  if (error || !data?.couple_id) throw new Error('An accepted couple link is required')
  return data.couple_id as string
}

export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  const user = await currentUser()
  const { data, error } = await supabase.from('onboarding_progress').select('*').eq('user_id', user.id).maybeSingle()
  if (error) throw error
  return data as OnboardingProgress | null
}

export async function initializeOnboarding(): Promise<OnboardingProgress> {
  const user = await currentUser()
  const { data, error } = await supabase
    .from('onboarding_progress')
    .upsert({ user_id: user.id, data: { current_step: 1, completed_steps: [], is_completed: false } }, { onConflict: 'user_id' })
    .select().single()
  if (error) throw error
  return data as OnboardingProgress
}

async function saveProgress(update: Partial<OnboardingProgress['data']>) {
  const current = (await getOnboardingProgress()) ?? (await initializeOnboarding())
  const { data, error } = await supabase.from('onboarding_progress')
    .update({ data: { ...current.data, ...update } }).eq('user_id', current.user_id).select().single()
  if (error) throw error
  return data as OnboardingProgress
}

export async function updateOnboardingStep(step: number) {
  if (step < 1 || step > STEPS) throw new Error('Invalid onboarding step')
  return saveProgress({ current_step: step })
}

export async function completeOnboardingStep(step: number) {
  const current = (await getOnboardingProgress()) ?? (await initializeOnboarding())
  return saveProgress({
    completed_steps: Array.from(new Set([...(current.data.completed_steps ?? []), step])),
    current_step: Math.min(STEPS, step + 1),
  })
}

export const skipOnboardingStep = completeOnboardingStep
export async function finishOnboarding() { return saveProgress({ is_completed: true, current_step: STEPS, completed_at: new Date().toISOString() }) }

export async function resetOnboarding(): Promise<void> {
  const user = await currentUser()
  const { error } = await supabase.from('onboarding_progress').delete().eq('user_id', user.id)
  if (error) throw error
}

export async function needsOnboarding(): Promise<boolean> { return !(await getOnboardingProgress())?.data.is_completed }

export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  const user = await currentUser()
  if (data.name || data.birth_date || data.gender) {
    const { error } = await supabase.from('profiles').update({
      ...(data.name ? { full_name: data.name } : {}),
      ...(data.birth_date ? { birth_date: data.birth_date } : {}),
      ...(data.gender ? { gender: data.gender } : {}),
    }).eq('id', user.id)
    if (error) throw error
  }
  if (data.blood_type || data.height_cm || data.weight_kg) {
    const { error } = await supabase.from('health_profiles').upsert({ user_id: user.id, ...data }, { onConflict: 'user_id' })
    if (error) throw error
  }
  if (data.last_period_date || data.cycle_length) {
    const couple_id = await currentCoupleId(user.id)
    const { error } = await supabase.from('care_cycle_settings').upsert({
      ...(data.cycle_length ? { cycle_length: data.cycle_length } : {}),
      ...(data.last_period_date ? { last_period_start: data.last_period_date } : {}), couple_id, updated_by: user.id,
    }, { onConflict: 'couple_id' })
    if (error) throw error
  }
  await saveProgress({
    ...(data.notifications_enabled === undefined ? {} : { notifications_enabled: data.notifications_enabled }),
    ...(data.location_consent === undefined ? {} : { location_consent: data.location_consent }),
  })
}
