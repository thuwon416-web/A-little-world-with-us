import { Redis } from '@upstash/redis'
import { getDailyAiUsage } from '@/lib/ai/usage-log'

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetTime: number
  scope: 'distributed' | 'instance' | 'unavailable'
}

type MemoryLimit = { count: number; resetTime: number }

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
const redisConfigured = Boolean(redisUrl && redisToken)
const redis = redisConfigured
  ? new Redis({ url: redisUrl!, token: redisToken! })
  : null
const memoryStore = new Map<string, MemoryLimit>()
let lastMemoryCleanup = 0
let unavailableLogged = false
const canUseMemoryFallback =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

const INCREMENT_WITH_EXPIRY = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = redis.call('PTTL', KEYS[1])
end
return {count, ttl}
`

async function incrementDistributed(
  key: string,
  ttlMs: number
): Promise<{ count: number; remainingMs: number }> {
  if (!redis) throw new Error('Redis rate limiting is not configured')

  const result = await redis.eval<[string], [number, number]>(
    INCREMENT_WITH_EXPIRY,
    [key],
    [String(ttlMs)]
  )
  if (
    !Array.isArray(result) ||
    typeof result[0] !== 'number' ||
    typeof result[1] !== 'number' ||
    result[0] < 1 ||
    result[1] < 0
  ) {
    throw new Error('Redis returned an invalid rate limit result')
  }

  return { count: result[0], remainingMs: result[1] }
}

function incrementInMemory(
  key: string,
  limit: number,
  now: number,
  resetTime: number
): RateLimitResult {
  if (now - lastMemoryCleanup >= 60_000) {
    for (const [storedKey, entry] of memoryStore) {
      if (now >= entry.resetTime) memoryStore.delete(storedKey)
    }
    lastMemoryCleanup = now
  }

  const existing = memoryStore.get(key)
  if (!existing || now >= existing.resetTime) {
    memoryStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetTime,
      scope: 'instance',
    }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime, scope: 'instance' }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetTime: existing.resetTime,
    scope: 'instance',
  }
}

function unavailable(resetTime: number): RateLimitResult {
  if (!unavailableLogged) {
    console.error('Distributed rate limiting is unavailable; denying requests in production.')
    unavailableLogged = true
  }
  return { allowed: false, remaining: 0, resetTime, scope: 'unavailable' }
}

async function checkLimit(
  key: string,
  limit: number,
  windowMs: number,
  resetTime: number
): Promise<RateLimitResult> {
  const now = Date.now()
  if (redis) {
    try {
      const result = await incrementDistributed(key, windowMs)
      return {
        allowed: result.count <= limit,
        remaining: Math.max(0, limit - result.count),
        resetTime: Date.now() + result.remainingMs,
        scope: 'distributed',
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      if (!canUseMemoryFallback) return unavailable(resetTime)
    }
  } else if (!canUseMemoryFallback) {
    return unavailable(resetTime)
  }

  return incrementInMemory(key, limit, now, resetTime)
}

export async function checkDailyRateLimit(
  userId: string,
  limit: number = 75
): Promise<RateLimitResult> {
  const now = new Date()
  const dateKey = now.toISOString().slice(0, 10)
  const resetTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  const key = `ratelimit:daily:v2:${encodeURIComponent(userId)}:${dateKey}`
  const ttlMs = Math.max(1, resetTime - Date.now())
  return checkLimit(key, limit, ttlMs, resetTime)
}

export async function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now()
  const resetTime = now + windowMs
  const key = `ratelimit:v2:${windowMs}:${encodeURIComponent(userId)}`
  return checkLimit(key, limit, windowMs, resetTime)
}

export async function checkAiUsageLimit(
  userId: string,
  dailyLimit: number
): Promise<{ allowed: boolean; currentUsage: number; resetTime: Date }> {
  const currentUsage = await getDailyAiUsage(userId)
  const now = new Date()
  const resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  return {
    allowed: currentUsage < dailyLimit,
    currentUsage,
    resetTime,
  }
}
