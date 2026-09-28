import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const redisMock = vi.hoisted(() => ({
  eval: vi.fn(),
}))

vi.mock('@upstash/redis', () => ({
  Redis: class {
    eval = redisMock.eval
  },
}))
vi.mock('server-only', () => ({}))

describe('rate limits', () => {
  beforeEach(() => {
    vi.resetModules()
    redisMock.eval.mockReset()
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('uses separate instance-local buckets for separate identifiers', async () => {
    const { checkRateLimit } = await import('./rate-limit')

    const first = await checkRateLimit('ai:one', 1, 60_000)
    const blocked = await checkRateLimit('ai:one', 1, 60_000)
    const isolated = await checkRateLimit('ai:two', 1, 60_000)

    expect(first).toMatchObject({ allowed: true, remaining: 0, scope: 'instance' })
    expect(blocked).toMatchObject({ allowed: false, scope: 'instance' })
    expect(isolated).toMatchObject({ allowed: true, scope: 'instance' })
    expect(blocked.resetTime).toBe(first.resetTime)
  })

  it('fails closed in production when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { checkRateLimit } = await import('./rate-limit')

    await expect(checkRateLimit('user-1')).resolves.toMatchObject({
      allowed: false,
      remaining: 0,
      scope: 'unavailable',
    })
  })

  it('uses an atomic Redis increment/expiry and reports the Redis window reset', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    redisMock.eval.mockResolvedValue([1, 30_000])
    const { checkRateLimit } = await import('./rate-limit')
    const startedAt = Date.now()

    const result = await checkRateLimit('ai:one', 3, 60_000)

    expect(redisMock.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('INCR'"),
      ['ratelimit:v2:60000:ai%3Aone'],
      ['60000']
    )
    expect(result).toMatchObject({ allowed: true, remaining: 2, scope: 'distributed' })
    expect(result.resetTime).toBeGreaterThanOrEqual(startedAt + 30_000)
    expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 30_000)
  })

  it('does not fall back to instance memory when Redis fails in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    redisMock.eval.mockRejectedValue(new Error('Redis unavailable'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { checkRateLimit } = await import('./rate-limit')

    const result = await checkRateLimit('user-1')

    expect(result).toMatchObject({ allowed: false, remaining: 0, scope: 'unavailable' })
  })
})
