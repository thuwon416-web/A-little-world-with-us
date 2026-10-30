const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
]

function getTurnUrls(): string[] {
  return (process.env.NEXT_PUBLIC_TURN_URLS ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.startsWith('turn:') || url.startsWith('turns:'))
}

export function getCallIceConfiguration(): RTCConfiguration {
  const turnUrls = getTurnUrls()
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim()
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim()

  const iceServers: RTCIceServer[] = DEFAULT_STUN_SERVERS.map((url) => ({ urls: url }))

  if (turnUrls.length > 0 && username && credential) {
    iceServers.push({
      urls: turnUrls,
      username,
      credential,
    })
  }

  return { iceServers }
}


let cachedDynamicConfiguration: { configuration: RTCConfiguration; expiresAt: number } | null = null

function isDynamicIceServerArray(value: unknown): value is RTCIceServer[] {
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
    const requiresAuth = urls.some((url) => /^turns?:/i.test(url))
    return !requiresAuth || (
      typeof server.username === 'string' && server.username.length > 0 &&
      typeof server.credential === 'string' && server.credential.length > 0
    )
  })
}

export async function getCallIceConfigurationAsync(
  accessToken?: string,
  appUrl?: string
): Promise<RTCConfiguration> {
  const fallback = getCallIceConfiguration()
  if (!accessToken || !appUrl) return fallback
  if (cachedDynamicConfiguration && cachedDynamicConfiguration.expiresAt > Date.now()) {
    return cachedDynamicConfiguration.configuration
  }

  try {
    const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl
    const response = await fetch(`${baseUrl}/api/turn/credentials`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!response.ok) return fallback
    const payload = await response.json() as { iceServers?: unknown; expiresAt?: unknown }
    if (!isDynamicIceServerArray(payload.iceServers)) return fallback
    const configuration = { iceServers: payload.iceServers }
    const now = Date.now()
    const providerExpiry = typeof payload.expiresAt === 'number' ? payload.expiresAt : now + 10 * 60_000
    const cacheExpiry = Math.min(now + 15 * 60_000, providerExpiry - 5 * 60_000)
    if (cacheExpiry > now) cachedDynamicConfiguration = { configuration, expiresAt: cacheExpiry }
    return configuration
  } catch {
    return fallback
  }
}
