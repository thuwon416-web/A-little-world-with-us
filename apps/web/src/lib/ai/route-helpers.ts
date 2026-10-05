import { type NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient }
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'

type AiRouteAuthContext = {
  userId: string
  supabase: SupabaseClient
}

export const AI_ROUTE_RATE_LIMIT = {
  limit: 10,
  windowMs: 60_000,
} as const

export const AI_COMPLETION_BUDGET = 800

export function withAiRouteAuth(
  handler: (request: NextRequest, context: AiRouteAuthContext) => Promise<NextResponse>
) {
  return async function handleAiRoute(request: NextRequest): Promise<NextResponse> {
    const authorization = request.headers.get('authorization')
    const supabase = authorization
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: { headers: { Authorization: authorization } },
            auth: { autoRefreshToken: false, persistSession: false },
          }
        )
      : createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // Handle cookie updates if needed
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const rateLimitResult = await checkRateLimit(
      `ai:${user.id}`,
      AI_ROUTE_RATE_LIMIT.limit,
      AI_ROUTE_RATE_LIMIT.windowMs
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      )
    }

    return handler(request, { userId: user.id, supabase })
  }
}

export type AiRouteProvider = 'groq' | 'gemini'

export function optionalString(maxLength: number) {
  return z.string().max(maxLength).optional()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getAiResponseText(
  data: unknown,
  provider: AiRouteProvider,
  fallback: string
): string {
  if (!isRecord(data)) return fallback

  if (provider === 'groq') {
    const choices = Array.isArray(data.choices) ? data.choices : []
    const firstChoice = choices[0]
    if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return fallback
    const content = firstChoice.message.content
    return typeof content === 'string' && content ? content : fallback
  }

  const candidates = Array.isArray(data.candidates) ? data.candidates : []
  const firstCandidate = candidates[0]
  if (!isRecord(firstCandidate) || !isRecord(firstCandidate.content)) return fallback
  const parts = Array.isArray(firstCandidate.content.parts) ? firstCandidate.content.parts : []
  const firstPart = parts[0]
  if (!isRecord(firstPart)) return fallback
  const text = firstPart.text
  return typeof text === 'string' && text ? text : fallback
}

export function parseAiJsonResponse<T>(
  data: unknown,
  provider: AiRouteProvider,
  fallback: T,
  parse: (text: string) => T
): T {
  const text = getAiResponseText(data, provider, '[]')
  try {
    return parse(text)
  } catch {
    return fallback
  }
}
