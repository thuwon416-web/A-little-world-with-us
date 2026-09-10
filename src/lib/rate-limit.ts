import { Redis } from '@upstash/redis'

// Initialize Redis client (fallback to in-memory if not configured)
let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

// Fallback in-memory store for development
const memoryStore = new Map<string, { count: number; resetTime: number }>()

export async function checkDailyRateLimit(
  userId: string,
  limit: number = 75
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = new Date()
  const dateKey = now.toISOString().slice(0, 10)
  const key = `ai-guardian:${userId}:${dateKey}`
  const nextUtcDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const resetTime = nextUtcDay

  if (redis) {
    try {
      const result = await redis.incr(key)
      if (result === 1) {
        await redis.expire(key, Math.ceil((resetTime - Date.now()) / 1000))
      }

      return {
        allowed: result <= limit,
        remaining: Math.max(0, limit - result),
        resetTime,
      }
    } catch (error) {
      console.error('Redis daily rate limit error, falling back to memory:', error)
    }
  }

  const userLimit = memoryStore.get(key)
  if (!userLimit || now.getTime() >= userLimit.resetTime) {
    memoryStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }

  if (userLimit.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: userLimit.resetTime }
  }

  userLimit.count += 1
  return { allowed: true, remaining: limit - userLimit.count, resetTime: userLimit.resetTime }
}

export async function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const resetTime = now + windowMs
  const key = `ratelimit:${userId}`

  if (redis) {
    // Use Upstash Redis for production
    try {
      const result = await redis.incr(key)
      
      if (result === 1) {
        // First request in window, set expiry
        await redis.expire(key, Math.ceil(windowMs / 1000))
      }

      const remaining = Math.max(0, limit - result)
      const allowed = result <= limit

      return { allowed, remaining, resetTime }
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error)
      // Fall back to memory store on error
    }
  }

  // Fallback to in-memory store
  const userLimit = memoryStore.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    memoryStore.set(userId, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: userLimit.resetTime }
  }
  
  userLimit.count++
  return { allowed: true, remaining: limit - userLimit.count, resetTime: userLimit.resetTime }
}
