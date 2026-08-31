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
      console.warn('Unable to read current user from Supabase:', error.message)
      return null
    }

    return user?.id ?? null
  } catch (error) {
    console.warn('Supabase user lookup failed:', error)
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
      console.warn(`Supabase read failed for ${table}:`, error.message)
      return []
    }

    return (data ?? []) as T[]
  } catch (error) {
    console.warn(`Supabase read error for ${table}:`, error)
    return []
  }
}

export async function insertRow<T>(
  table: string,
  payload: Record<string, unknown>
): Promise<T | null> {
  if (!isSupabaseConfigured) return null

  try {
    const { data, error } = await supabase.from(table).insert(payload).select()
    if (error) {
      console.warn(`Supabase insert failed for ${table}:`, error.message)
      return null
    }

    return (data?.[0] ?? null) as T | null
  } catch (error) {
    console.warn(`Supabase insert error for ${table}:`, error)
    return null
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
