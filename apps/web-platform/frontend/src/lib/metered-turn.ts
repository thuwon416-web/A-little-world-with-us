import { Redis } from '@upstash/redis'

export type MeteredTurnCredential = {
  apiKey: string
  username: string
  createdAt: number
  availableAt: number
  expiresAt: number
}

const CURRENT_KEY = 'turn:metered:credential:current:v1'
const PENDING_KEY = 'turn:metered:credential:pending:v1'
const CREDENTIAL_TTL_SECONDS = 48 * 60 * 60

let redis: Redis | null | undefined

export function getMeteredRedis(): Redis | null {
  if (redis !== undefined) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  redis = url && token ? new Redis({ url, token }) : null
  return redis
}

export function getMeteredAppUrl(): URL | null {
  const value = process.env.METERED_APP_URL?.trim()
  if (!value) return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      !url.hostname.endsWith('.metered.live') ||
      url.hostname === 'metered.live' ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) return null
    return url
  } catch {
    return null
  }
}

function isCredential(value: unknown): value is MeteredTurnCredential {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<MeteredTurnCredential>
  return (
    typeof record.apiKey === 'string' && record.apiKey.length >= 16 && record.apiKey.length <= 256 &&
    typeof record.username === 'string' && record.username.length > 0 && record.username.length <= 256 &&
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt) &&
    typeof record.availableAt === 'number' && Number.isFinite(record.availableAt) &&
    typeof record.expiresAt === 'number' && Number.isFinite(record.expiresAt)
  )
}

export async function getPendingMeteredCredential(store: Redis): Promise<MeteredTurnCredential | null> {
  const pending = await store.get<unknown>(PENDING_KEY)
  return isCredential(pending) ? pending : null
}

export async function promotePendingMeteredCredential(
  store: Redis
): Promise<MeteredTurnCredential | null> {
  const pending = await getPendingMeteredCredential(store)
  if (!pending) return null
  const now = Date.now()
  if (now < pending.availableAt) return null
  if (now >= pending.expiresAt) {
    await store.del(PENDING_KEY)
    return null
  }
  const ttlSeconds = Math.max(60, Math.floor((pending.expiresAt - now) / 1000))
  await store.set(CURRENT_KEY, pending, { ex: ttlSeconds })
  await store.del(PENDING_KEY)
  return pending
}

export async function getCurrentMeteredCredential(
  store: Redis
): Promise<MeteredTurnCredential | null> {
  await promotePendingMeteredCredential(store)
  const current = await store.get<unknown>(CURRENT_KEY)
  if (!isCredential(current) || current.expiresAt <= Date.now()) return null
  return current
}

export async function getMeteredIceServers(apiKey: string): Promise<unknown> {
  const appUrl = getMeteredAppUrl()
  if (!appUrl) throw new Error('Metered TURN provider is not configured')
  const endpoint = new URL('/api/v1/turn/credentials', appUrl)
  endpoint.searchParams.set('apiKey', apiKey)
  const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' })
  if (!response.ok) throw new Error('Metered TURN credentials could not be retrieved')
  return response.json()
}

export function isIceServerArray(value: unknown): value is RTCIceServer[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 16) return false
  return value.every((item) => {
    if (!item || typeof item !== 'object') return false
    const server = item as { urls?: unknown; username?: unknown; credential?: unknown }
    const urls = typeof server.urls === 'string'
      ? [server.urls]
      : Array.isArray(server.urls) && server.urls.every((url) => typeof url === 'string')
        ? server.urls
        : []
    if (!urls.length || urls.some((url) => !/^(stun|turn|turns):/i.test(url))) return false
    const needsAuth = urls.some((url) => /^turns?:/i.test(url))
    return !needsAuth || (
      typeof server.username === 'string' && server.username.length > 0 &&
      typeof server.credential === 'string' && server.credential.length > 0
    )
  })
}

export const meteredCredentialTtlSeconds = CREDENTIAL_TTL_SECONDS
