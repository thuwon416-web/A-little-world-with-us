import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please copy .env.example to .env and fill in your values.'
  )
}

export const isSupabaseConfigured = true

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return null
    }

    return user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Singleton Supabase client for browser-side usage.
 * Falls back to a safe placeholder client so the app keeps working when the database is not configured yet.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export async function readRows<T>(
  table: string,
  query = '*',
  order?: { column: string; ascending?: boolean }
): Promise<T[]> {
  if (!isSupabaseConfigured) return []

  try {
    let request = supabase.from(table).select(query)
    if (order) {
      request = request.order(order.column, { ascending: order.ascending ?? true })
    }

    const { data, error } = await request
    if (error) {
      return []
    }

    return (data ?? []) as T[]
  } catch {
    return []
  }
}

export async function readUserRows<T>(
  table: string,
  query = '*',
  order?: { column: string; ascending?: boolean }
): Promise<T[]> {
  if (!isSupabaseConfigured) return []

  try {
    const userId = await getCurrentUserId()
    if (!userId) return []

    let request = supabase.from(table).select(query).eq('user_id', userId)
    if (order) {
      request = request.order(order.column, { ascending: order.ascending ?? true })
    }

    const { data, error } = await request
    if (error) {
      return []
    }

    return (data ?? []) as T[]
  } catch {
    return []
  }
}

export async function insertRow<T>(
  table: string,
  payload: Record<string, unknown>
): Promise<T | null> {
  if (!isSupabaseConfigured) return null

  try {
    const userId = await getCurrentUserId()
    if (userId && !payload.user_id) {
      payload.user_id = userId
    }

    const { data, error } = await supabase.from(table).insert(payload).select()
    if (error) {
      return null
    }

    return (data?.[0] ?? null) as T | null
  } catch {
    return null
  }
}

export async function deleteRow(table: string, id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  try {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      return false
    }

    return true
  } catch {
    return false
  }
}

// Type definitions for our tables
export type Memory = {
  id: number
  created_at: string
  image_url: string
  caption: string | null
  date: string
  user_id?: string | null
  category?: string | null
  reveal_at?: string | null
}

export type Message = {
  id: string
  created_at: string
  sender_id: string
  couple_id: string
  content: string
  visibility: 'private' | 'shared' | 'partner_only'
  reply_to_id?: string | null
  media_type?: 'image' | 'voice' | 'none'
  media_url?: string | null
  profiles?: { full_name?: string | null }
}

export type SecretLetter = {
  id: number
  created_at: string
  title: string
  content: string
  is_locked: boolean
  category?: string | null
  reveal_at?: string | null
}

export type Reminder = {
  id: string
  user_id: string
  couple_id?: string | null
  title: string
  description?: string | null
  reminder_date: string
  reminder_type: 'custom' | 'anniversary' | 'birthday' | 'cycle' | 'medication'
  repeat_interval?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  notified: boolean
  created_at: string
}
