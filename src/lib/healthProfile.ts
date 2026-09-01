/**
 * Health Profile Management - Phase 5
 * Functions for managing health profiles and partner health data
 */

import { supabase } from './supabase'

export interface HealthProfile {
  id: string
  user_id: string
  couple_id: string | null
  blood_type: string | null
  height_cm: number | null
  weight_kg: number | null
  allergies: string[]
  medications: string[]
  conditions: string[]
  emergency_contact: {
    name: string
    phone: string
    relationship: string
  }
  created_at: string
  updated_at: string
}

export interface HealthProfileInput {
  blood_type?: string
  height_cm?: number
  weight_kg?: number
  allergies?: string[]
  medications?: string[]
  conditions?: string[]
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
}

/**
 * Get current user's health profile
 */
export async function getHealthProfile(): Promise<HealthProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('health_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    return null
  }

  return data as HealthProfile
}

/**
 * Save (create or update) health profile
 */
export async function saveHealthProfile(data: HealthProfileInput): Promise<HealthProfile> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if profile exists
  const existing = await getHealthProfile()

  if (existing) {
    // Update existing profile
    const { data: updated, error } = await supabase
      .from('health_profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error('Failed to update health profile')
    }

    return updated as HealthProfile
  } else {
    // Create new profile
    const { data: created, error } = await supabase
      .from('health_profiles')
      .insert({
        user_id: user.id,
        ...data,
      })
      .select()
      .single()

    if (error) {
      throw new Error('Failed to create health profile')
    }

    return created as HealthProfile
  }
}

/**
 * Delete health profile
 */
export async function deleteHealthProfile(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('health_profiles')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to delete health profile')
  }
}

/**
 * Get partner's health profile (if coupled)
 */
export async function getPartnerHealthProfile(): Promise<HealthProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Get couple link
  const { data: link } = await supabase
    .from('couple_links')
    .select('*')
    .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
    .eq('status', 'accepted')
    .single()

  if (!link) {
    return null
  }

  const partnerId = link.inviter_id === user.id ? link.accepted_by : link.inviter_id

  const { data, error } = await supabase
    .from('health_profiles')
    .select('*')
    .eq('user_id', partnerId)
    .single()

  if (error) {
    return null
  }

  return data as HealthProfile
}

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100
  return Number((weightKg / (heightM * heightM)).toFixed(1))
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): { category: string; color: string } {
  if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-400' }
  if (bmi < 25) return { category: 'Normal', color: 'text-green-400' }
  if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-400' }
  return { category: 'Obese', color: 'text-red-400' }
}

/**
 * Blood type options with Myanmar translations
 */
export const BLOOD_TYPES = [
  { value: 'A+', label: 'A+', labelMM: 'A ပေါ်တိုး' },
  { value: 'A-', label: 'A-', labelMM: 'A အနှတ်' },
  { value: 'B+', label: 'B+', labelMM: 'B ပေါ်တိုး' },
  { value: 'B-', label: 'B-', labelMM: 'B အနှတ်' },
  { value: 'AB+', label: 'AB+', labelMM: 'AB ပေါ်တိုး' },
  { value: 'AB-', label: 'AB-', labelMM: 'AB အနှတ်' },
  { value: 'O+', label: 'O+', labelMM: 'O ပေါ်တိုး' },
  { value: 'O-', label: 'O-', labelMM: 'O အနှတ်' },
]
