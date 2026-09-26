import NetInfo from '@react-native-community/netinfo'
import * as Crypto from 'expo-crypto'

export type AIClientErrorKind =
  'offline' | 'timeout' | 'rate_limit' | 'server' | 'invalid_response' | 'unknown'

export class AIClientError extends Error {
  constructor(
    message: string,
    public readonly kind: AIClientErrorKind,
    public readonly status?: number
  ) {
    super(message)
    this.name = 'AIClientError'
  }
}

export type RequestAIOptions<T> = {
  timeoutMs?: number
  maxAttempts?: number
  baseDelayMs?: number
  parse: (data: unknown) => T
}

const defaultTimeoutMs = 15_000
const defaultMaxAttempts = 3
const defaultBaseDelayMs = 500
const maxBackoffMs = 4_000
const jitterMaxMs = 250
const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504])

export async function requestAI<T>(
  url: string,
  init: RequestInit,
  options: RequestAIOptions<T>
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs
  const maxAttempts = Math.max(1, options.maxAttempts ?? defaultMaxAttempts)
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? defaultBaseDelayMs)

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchAttempt(url, init, timeoutMs)
      if (!response.ok) {
        const error = new AIClientError(
          getHttpErrorMessage(response.status),
          getErrorKind(response.status),
          response.status
        )
        if (!retryableStatuses.has(response.status) || attempt === maxAttempts) throw error
        await waitForRetry(attempt, baseDelayMs)
        continue
      }

      let data: unknown
      try {
        data = await response.json()
      } catch {
        throw new AIClientError('The AI service returned an invalid response.', 'invalid_response')
      }

      try {
        return options.parse(data)
      } catch (error) {
        if (error instanceof AIClientError) throw error
        throw new AIClientError('The AI service returned an invalid response.', 'invalid_response')
      }
    } catch (error) {
      const normalized = await normalizeError(error)
      const canRetry =
        normalized.kind === 'offline' ||
        normalized.kind === 'timeout' ||
        normalized.kind === 'unknown'

      if (!canRetry || attempt === maxAttempts) throw normalized
      await waitForRetry(attempt, baseDelayMs)
    }
  }

  throw new AIClientError('The AI request could not be completed.', 'unknown')
}

async function fetchAttempt(url: string, init: RequestInit, timeoutMs: number) {
  if (init.signal?.aborted) {
    throw new AIClientError('The AI request was cancelled.', 'unknown')
  }

  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (timedOut || (error instanceof Error && error.name === 'AbortError')) {
      throw new AIClientError('The AI request timed out.', 'timeout')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function normalizeError(error: unknown): Promise<AIClientError> {
  if (error instanceof AIClientError) return error
  if (await isOffline()) {
    return new AIClientError(
      'You appear to be offline. Check your connection and try again.',
      'offline'
    )
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new AIClientError('The AI request timed out.', 'timeout')
  }
  return new AIClientError(
    'The AI service is temporarily unavailable. Please try again.',
    'unknown'
  )
}

async function isOffline() {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) return true
  const state = await NetInfo.fetch()
  return state.isConnected === false || state.isInternetReachable === false
}

function getErrorKind(status: number): AIClientErrorKind {
  if (status === 429) return 'rate_limit'
  if (status >= 500) return 'server'
  return 'unknown'
}

function getHttpErrorMessage(status: number) {
  if (status === 429) return 'Too many AI requests. Please try again shortly.'
  if (status >= 500) return 'The AI service is temporarily unavailable. Please try again.'
  return `The AI request failed with status ${status}.`
}

async function waitForRetry(attempt: number, baseDelayMs: number) {
  const exponentialDelay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxBackoffMs)
  const randomValue = Crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
  const jitter = Math.floor(randomValue * (jitterMaxMs + 1))
  await new Promise<void>((resolve) => setTimeout(resolve, exponentialDelay + jitter))
}
