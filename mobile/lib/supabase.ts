import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please copy .env.example to .env and fill in your values.'
  )
}

export const isSupabaseConfigured = true

export let networkStatus = { isConnected: true }

export const queuedRequests: (() => Promise<unknown>)[] = []

export const setNetworkStatus = (connected: boolean) => {
  networkStatus = { isConnected: connected }
}

export const queueFailedRequest = (task: () => Promise<unknown>) => {
  queuedRequests.push(task)
}

export const safeSupabaseRequest = async <T>(
  request: () => Promise<{ data: T | null; error: { message: string } | null }>
) => {
  if (!networkStatus.isConnected) {
    queueFailedRequest(() => request())
    return { data: null, error: { message: 'Offline. Request queued for sync.' } }
  }

  try {
    return await request()
  } catch (error) {
    queueFailedRequest(() => request())
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'Unknown network error' },
    }
  }
}

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
