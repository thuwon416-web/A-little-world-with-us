import { supabase } from '@/lib/supabase'

type PrivateChatMediaType = 'voice' | 'photo'

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

// In-memory cache for signed URLs with expiry
// 500-entry limit prevents memory leak (cache evicts oldest entries)
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

/**
 * Resolves only paths written by the current private-media implementation.
 * Legacy external URLs remain untouched so existing GIF/file messages keep
 * working. Signed links are deliberately short lived and never written back
 * to the database.
 * 
 * Caching: URLs are cached for 55 minutes (with 5-minute buffer before expiry)
 * to avoid frequent createSignedUrl calls while ensuring URLs don't expire.
 */
export async function resolveChatMediaUrl(
  value: string | null,
  type: PrivateChatMediaType
): Promise<string | null> {
  if (!value || isHttpUrl(value)) return value

  const bucket = type === 'voice' ? 'voice_messages' : 'chat_photos'
  const cacheKey = `${bucket}:${value}`
  const now = Date.now()
  const FIVE_MINUTES_MS = 5 * 60 * 1000

  // Check cache with 5-minute buffer before expiry
  const cached = signedUrlCache.get(cacheKey)
  if (cached) {
    if (cached.expiresAt <= now) {
      signedUrlCache.delete(cacheKey)
    } else if (cached.expiresAt > now + FIVE_MINUTES_MS) {
      return cached.url
    }
  }

  // Enforce cache size limit to prevent memory leak
  while (signedUrlCache.size >= 500) {
    const firstKey = signedUrlCache.keys().next().value
    if (!firstKey) break
    signedUrlCache.delete(firstKey)
  }

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(value, 60 * 60)
  if (error || !data?.signedUrl) return null
  
  // Cache with 55-minute expiry (5-minute buffer)
  signedUrlCache.set(cacheKey, {
    url: data.signedUrl,
    expiresAt: now + (55 * 60 * 1000),
  })

  return data.signedUrl
}
