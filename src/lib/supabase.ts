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
  if (!isSupabaseConfigured) return null

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) return null
    return user?.id ?? null
  } catch {
    return null
  }
}

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
    if (error) return []

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
    if (error) return []

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
    // ❌ ဒီနေရာမှာ user_id ကို အလိုအလျောက် ထည့်ပေးနေတဲ့ code ကို ဖျက်လိုက်ပါပြီ။
    // သက်ဆိုင်ရာ table ရဲ့ column တွေကို caller ကပဲ တိကျစွာ ထည့်ပေးရပါမယ်။
    const { data, error } = await supabase.from(table).insert(payload).select()
    if (error) return null

    return (data?.[0] ?? null) as T | null
  } catch {
    return null
  }
}

export async function deleteRow(table: string, id: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  try {
    let query = supabase.from(table).delete().eq('id', id)

    query = query.eq('user_id', userId)

    const { error } = await query
    if (error) return false

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

// ✅ Message type ကို Actual Database Schema နဲ့ ကိုက်ညီအောင် ပြင်ထားပါတယ်။
export type Message = {
  id: string
  created_at: string
  sender_id: string
  couple_id: string
  content: string
  message_type: 'text' | 'voice' | 'photo' | 'sticker' | 'gif' | 'file' | 'video' | 'audio' | 'location' | 'sos'
  media_url?: string | null
  media_duration?: number | null
  location_payload?: { latitude: number; longitude: number; accuracy?: number; label?: string } | null
  encrypted?: boolean
  reply_to?: string | null
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
  if (typeof window === 'undefined') return await queryFn()

  const cached = localStorage.getItem(`cache:${key}`)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < ttlSeconds * 1000) return data
    } catch {
      // Invalid cache, ignore
    }
  }

  const data = await queryFn()
  try {
    localStorage.setItem(`cache:${key}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // localStorage might be full or disabled, ignore
  }
  return data
}
