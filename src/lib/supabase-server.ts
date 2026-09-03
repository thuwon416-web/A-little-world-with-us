import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please copy .env.example to .env and fill in your values.'
  )
}

/**
 * Create a Supabase client for server-side usage
 */
export function createServerClient() {
  const cookieStore = cookies()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieStore.get(key)?.value || null
        },
        setItem: (key: string, value: string) => {
          cookieStore.set({ name: key, value, httpOnly: true, sameSite: 'lax', path: '/' })
        },
        removeItem: (key: string) => {
          cookieStore.delete({ name: key, path: '/' })
        },
      },
    },
  })
}
