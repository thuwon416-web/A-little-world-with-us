// Global type definitions for the entire app

export type Message = {
  id: number
  created_at: string
  sender: 'me' | 'her'
  text: string
}

export type Memory = {
  id: number
  created_at: string
  image_url: string
  caption: string | null
  date: string
}

export type SecretLetter = {
  id: number
  created_at: string
  title: string
  content: string
  is_locked: boolean
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export type CycleData = {
  lastPeriodStart: string
  averageCycleLength: number
  averagePeriodLength: number
  currentPhase: CyclePhase
  nextPeriodDate: string
}
