import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

import { database } from '@/database'
import type { OfflineQueueModel } from '@/database/schema'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please copy .env.example to .env and fill in your values.'
  )
}

export const isSupabaseConfigured = true

export let networkStatus = { isConnected: true }

export const setNetworkStatus = (connected: boolean) => {
  networkStatus = { isConnected: connected }
}

export async function queueFailedRequest(request: { method: string; url: string; body?: unknown }) {
  await database.write(async () => {
    await database.get<OfflineQueueModel>('offline_queue').create((record) => {
      record.method = request.method
      record.url = request.url
      record.body = JSON.stringify(request.body ?? null)
      record.retry_count = 0
      record.created_at = new Date().toISOString()
    })
  })
}

export const safeSupabaseRequest = async <T>(
  request: () => Promise<{ data: T | null; error: { message: string } | null }>,
  queuedRequest?: { method: string; url: string; body?: unknown }
) => {
  if (!networkStatus.isConnected) {
    if (queuedRequest) await queueFailedRequest(queuedRequest)
    return { data: null, error: { message: 'Offline. Request queued for sync.' } }
  }

  try {
    return await request()
  } catch (error) {
    if (queuedRequest) await queueFailedRequest(queuedRequest)
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : 'Unknown network error' },
    }
  }
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries - 1) await wait(1000 * 3 ** attempt)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network request failed')
}

const customFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  const method = (init?.method ?? 'GET').toUpperCase()
  try {
    const request = () => fetch(input, { ...init, signal: controller.signal })
    return method === 'GET' || method === 'HEAD' ? await retryWithBackoff(request) : await request()
  } finally {
    clearTimeout(timeout)
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
  global: { fetch: customFetch },
})
