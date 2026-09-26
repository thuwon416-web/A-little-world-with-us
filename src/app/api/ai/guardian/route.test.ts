import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const { authGetUser, from, generateAiResponse, checkDailyRateLimit, checkAiUsageLimit } = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  from: vi.fn(),
  generateAiResponse: vi.fn(),
  checkDailyRateLimit: vi.fn(),
  checkAiUsageLimit: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: authGetUser },
    from,
  }),
}))

vi.mock('@/lib/ai/providers', () => ({
  AIProviderError: class AIProviderError extends Error {},
  generateAiResponse,
}))

vi.mock('@/lib/ai/usage-log', () => ({
  logAiUsage: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkDailyRateLimit,
  checkAiUsageLimit,
}))

vi.mock('@/lib/chatEncryptionServer', () => ({
  decryptChatMessageServer: vi.fn(),
}))

vi.mock('@/lib/ai/build-memories-context', () => ({
  buildMemoriesContext: vi.fn().mockResolvedValue(''),
}))

interface QueryResult {
  data: unknown
  error: null
}

interface QueryBuilder extends PromiseLike<QueryResult> {
  select(columns: string): QueryBuilder
  eq(column: string, value: string): QueryBuilder
  or(filters: string): QueryBuilder
  gte(column: string, value: string): QueryBuilder
  is(column: string, value: null): QueryBuilder
  in(column: string, values: string[]): QueryBuilder
  order(column: string, options: { ascending: boolean }): QueryBuilder
  limit(count: number): QueryBuilder
  maybeSingle(): Promise<QueryResult>
}

function makeQueryBuilder(result: QueryResult): QueryBuilder {
  const builder = {} as QueryBuilder
  Object.assign(builder, {
    select: () => builder,
    eq: () => builder,
    or: () => builder,
    gte: () => builder,
    is: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: async () => result,
    then: (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected),
  })
  return builder
}

import { POST } from './route'

function makeRequest(): NextRequest {
  return new Request('http://localhost/api/ai/guardian', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Give me a gentle suggestion.' }),
  }) as NextRequest
}

describe('POST /api/ai/guardian authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authGetUser.mockResolvedValue({ data: { user: null } })
    checkDailyRateLimit.mockResolvedValue({ allowed: true, remaining: 74, resetTime: Date.now() })
    checkAiUsageLimit.mockResolvedValue({ allowed: true, currentUsage: 0, resetTime: new Date() })
    generateAiResponse.mockResolvedValue({ content: 'A gentle suggestion.', provider: 'groq' })
    from.mockImplementation((table: string) => makeQueryBuilder({
      data: table === 'ai_context_memory' ? [] : null,
      error: null,
    }))
  })

  it('returns 401 when Supabase has no authenticated user', async () => {
    const response = await POST(makeRequest())

    expect(response.status).toBe(401)
    expect(generateAiResponse).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })

  it('continues through the route for an authenticated user', async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const response = await POST(makeRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ response: 'A gentle suggestion.' })
    expect(generateAiResponse).toHaveBeenCalledOnce()
  })
})
