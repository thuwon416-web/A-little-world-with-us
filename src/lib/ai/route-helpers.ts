import { z } from 'zod'

export const AI_ROUTE_RATE_LIMIT = {
  limit: 10,
  windowMs: 60_000,
} as const

export const MAX_TOKENS = 800

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
