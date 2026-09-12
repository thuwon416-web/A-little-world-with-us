/** Shared domain contracts backed by the verified Supabase bootstrap schema. */
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Couple {
  id: string
  name: string | null
  anniversary: string | null
  created_at: string
  updated_at: string
}

export interface Memory {
  id: string
  couple_id: string
  user_id: string
  title: string
  description: string | null
  caption: string | null
  image_url: string | null
  storage_path: string | null
  date: string
  category: 'favorite' | 'travel' | 'ritual' | 'journal' | string
  created_at: string
  updated_at: string
}

export type MessageType =
  'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file' | 'video' | 'audio' | 'location'

export interface ChatMessage {
  id: string
  couple_id: string
  sender_id: string
  content: string | null
  message_type: MessageType
  media_url: string | null
  media_duration: number | null
  reply_to: string | null
  transcript: string | null
  location_payload: Record<string, unknown> | null
  encrypted: boolean
  created_at: string
  updated_at: string
}

export interface CareLog {
  id: string
  couple_id: string
  user_id: string
  type: string
  completed_at: string
  created_at: string
}

export interface CareDailyLog {
  id: string
  couple_id: string
  user_id: string
  log_date: string
  period_day: boolean
  mood: string | null
  symptoms: string[]
  sex: string[]
  discharge: string[]
  digestion: string[]
  pregnancy_test: string[]
  ovulation_test: string | null
  contraceptives: string[]
  water_intake: number | null
  weight: number | null
  basal_temp: number | null
  notes: string | null
  activities: string[]
  other_tags: string[]
  created_at: string
  updated_at: string
}

export interface FinancialGoal {
  id: string
  couple_id: string
  user_id: string
  title: string
  description: string | null
  target_amount: number
  current_amount: number
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  couple_id: string
  user_id: string | null
  title: string
  event_date: string
  event_time: string | null
  description: string | null
  type: 'date' | 'trip' | 'goal' | 'life' | 'other'
  repeat: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  couple_id: string
  user_id: string | null
  title: string
  description: string | null
  type: string
  due_date: string | null
  status: string
  date: string | null
  created_at: string
  updated_at: string
}

export interface PlanItem {
  id: string
  plan_id: string
  title: string
  completed: boolean
  created_at: string
}

export interface WellnessLog {
  id: string
  user_id: string
  activity_type: string
  duration_minutes: number | null
  calories: number | null
  notes: string | null
  completed_at: string
  created_at: string
}

export interface VaultItem {
  id: string
  couple_id: string
  user_id: string
  title: string
  content: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface TimeCapsule {
  id: string
  couple_id: string
  user_id: string
  recipient_id: string
  title: string
  content: string | null
  unlock_at: string
  status: string
  revealed_at: string | null
  created_at: string
}

export interface PlaylistItem {
  id: string
  couple_id: string
  youtube_id: string
  title: string
  thumbnail_url: string | null
  notes: string | null
  is_anniversary_song: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface WatchlistItem {
  id: string
  couple_id: string
  youtube_id: string
  title: string
  thumbnail_url: string | null
  position: number
  created_at: string
}

export interface WatchHistoryItem {
  id: string
  couple_id: string
  youtube_id: string
  watched_at: string
  watched_by: string
}

export type RepeatFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ActivityType = WellnessLog['activity_type']
