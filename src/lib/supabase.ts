import { createBrowserClient } from '@supabase/ssr'

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
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
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

export async function deleteRow(table: string, id: string, userId?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  try {
    // Get user ID if not provided
    const effectiveUserId = userId ?? await getCurrentUserId()
    if (!effectiveUserId) {
      return false
    }

    // Delete with ownership check - only delete if user_id matches
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', effectiveUserId)
    
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
  id: string
  created_at: string
  image_url: string | null
  storage_path?: string | null
  title?: string | null
  description?: string | null
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

// Add caching helper for performance optimization
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  if (typeof window === 'undefined') {
    return await queryFn()
  }

  const cached = localStorage.getItem(`cache:${key}`)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < ttlSeconds * 1000) {
        return data
      }
    } catch {
      // Invalid cache, ignore
    }
  }

  const data = await queryFn()
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
    }))
  } catch {
    // localStorage might be full or disabled, ignore
  }
  return data
}
