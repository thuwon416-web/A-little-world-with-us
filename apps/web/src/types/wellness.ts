// src/types/wellness.ts
export type WellnessCategory = 'physical' | 'mental' | 'relationship'

export interface WellnessBoard {
  id: string
  title: string
  titleMy?: string // Myanmar translation
  description: string
  descriptionMy?: string // Myanmar translation
  category: WellnessCategory
  icon: string // Lucide icon name or emoji
  content?: string[]
  isCurated?: boolean // Flag for curated boards
}
