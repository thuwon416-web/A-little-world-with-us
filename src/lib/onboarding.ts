/**
 * Onboarding Management - Phase 7
 * Functions for managing user onboarding progress
 */

import { supabase } from './supabase'

export interface OnboardingProgress {
  id: string
  user_id: string
  current_step: number
  completed_steps: number[]
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface OnboardingData {
  name?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  partner_email?: string
  blood_type?: string
  height_cm?: number
  weight_kg?: number
  last_period_date?: string
  cycle_length?: number
}

const ONBOARDING_STEPS = 7

/**
 * Get current user's onboarding progress
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // If no progress exists, return null
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data
}

/**
 * Initialize onboarding progress for new user
 */
export async function initializeOnboarding(): Promise<OnboardingProgress> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('onboarding_progress')
    .insert({
      user_id: user.id,
      current_step: 1,
      completed_steps: [],
      is_completed: false,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error('Failed to initialize onboarding')
  }

  return data
}

/**
 * Update current onboarding step
 */
export async function updateOnboardingStep(step: number): Promise<OnboardingProgress> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  if (step < 1 || step > ONBOARDING_STEPS) {
    throw new Error('Invalid step number')
  }

  const { data, error } = await supabase
    .from('onboarding_progress')
    .update({ current_step: step })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    throw new Error('Failed to update onboarding step')
  }

  return data
}

/**
 * Mark a step as completed
 */
export async function completeOnboardingStep(step: number): Promise<OnboardingProgress> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get current progress
  const { data: current } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!current) {
    throw new Error('Onboarding not initialized')
  }

  // Add step to completed steps if not already there
  const completedSteps = current.completed_steps as number[]
  if (!completedSteps.includes(step)) {
    completedSteps.push(step)
  }

  // Move to next step if not at end
  const nextStep = step < ONBOARDING_STEPS ? step + 1 : step

  const { data, error } = await supabase
    .from('onboarding_progress')
    .update({
      completed_steps: completedSteps,
      current_step: nextStep,
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    throw new Error('Failed to complete onboarding step')
  }

  return data
}

/**
 * Skip a step (for optional steps)
 */
export async function skipOnboardingStep(step: number): Promise<OnboardingProgress> {
  return completeOnboardingStep(step)
}

/**
 * Finish onboarding
 */
export async function finishOnboarding(): Promise<OnboardingProgress> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('onboarding_progress')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      current_step: ONBOARDING_STEPS,
    })
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    throw new Error('Failed to finish onboarding')
  }

  return data
}

/**
 * Reset onboarding (for testing)
 */
export async function resetOnboarding(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('onboarding_progress')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to reset onboarding')
  }
}

/**
 * Check if user needs onboarding
 */
export async function needsOnboarding(): Promise<boolean> {
  const progress = await getOnboardingProgress()
  if (!progress) {
    return true
  }
  return !progress.is_completed
}

/**
 * Save onboarding data to profile/health/cycle tables
 */
export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Update profile with basic info
  if (data.name || data.birth_date || data.gender) {
    await supabase
      .from('profiles')
      .update({
        ...(data.name && { full_name: data.name }),
        ...(data.birth_date && { birth_date: data.birth_date }),
        ...(data.gender && { gender: data.gender }),
      })
      .eq('id', user.id)
  }

  // Save health profile if provided
  if (data.blood_type || data.height_cm || data.weight_kg) {
    const { data: existingHealth } = await supabase
      .from('health_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const healthData = {
      user_id: user.id,
      ...(data.blood_type && { blood_type: data.blood_type }),
      ...(data.height_cm && { height_cm: data.height_cm }),
      ...(data.weight_kg && { weight_kg: data.weight_kg }),
    }

    if (existingHealth) {
      await supabase
        .from('health_profiles')
        .update(healthData)
        .eq('id', existingHealth.id)
    } else {
      await supabase
        .from('health_profiles')
        .insert(healthData)
    }
  }

  // Save cycle data if provided (for female users)
  if (data.last_period_date || data.cycle_length) {
    const { data: existingCycle } = await supabase
      .from('cycle_logs')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingCycle) {
      await supabase
        .from('cycle_logs')
        .update({
          ...(data.last_period_date && { period_start: data.last_period_date }),
          ...(data.cycle_length && { cycle_length: data.cycle_length }),
        })
        .eq('id', existingCycle.id)
    } else {
      await supabase
        .from('cycle_logs')
        .insert({
          user_id: user.id,
          period_start: data.last_period_date || new Date().toISOString(),
          cycle_length: data.cycle_length || 28,
        })
    }
  }

  // Send partner invite if email provided
  if (data.partner_email) {
    try {
      const { createCoupleAndInvite } = await import('./couples')
      await createCoupleAndInvite(data.partner_email)
    } catch (error) {
      console.error('Failed to send partner invite:', error)
      // Don't throw - onboarding should continue even if invite fails
    }
  }
}
