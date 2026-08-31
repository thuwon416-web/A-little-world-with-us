// src/types/wellness.ts
export type WellnessCategory =
  | 'affirmation'
  | 'gratitude'
  | 'apology'
  | 'kindness'
  | 'calm'
  | 'love'
  | 'routine'
  | 'ritual'
  | 'wellness'

export interface WellnessContent {
  text: string
  action?: string // e.g., "Take a deep breath", "Send a hug"
}

export interface WellnessBoard {
  id: string
  title: string
  description: string
  category: WellnessCategory
  icon: string // Lucide icon name or emoji
  content: WellnessContent[]
}
