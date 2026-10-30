type RTCConfiguration = {
  iceServers: { urls: string | string[]; username?: string; credential?: string }[]
}

const DEFAULT_STUN_URL = 'stun:stun.l.google.com:19302'

function getTurnUrls() {
  return (process.env.EXPO_PUBLIC_TURN_URLS ?? '')
    .split(',')
    .map((url: string) => url.trim())
    .filter((url: string) => url.startsWith('turn:') || url.startsWith('turns:'))
}

/**
 * Uses STUN for ordinary networks and an optional TURN relay for restrictive
 * mobile networks. Public Expo variables are bundled into the app, so a TURN
 * provider should issue short-lived credentials.
 */
export function getCallIceConfiguration(): RTCConfiguration {
  const urls = getTurnUrls()
  const username = process.env.EXPO_PUBLIC_TURN_USERNAME?.trim()
  const credential = process.env.EXPO_PUBLIC_TURN_CREDENTIAL?.trim()

  return {
    iceServers: [
      { urls: DEFAULT_STUN_URL },
      ...(urls.length > 0 && username && credential ? [{ urls, username, credential }] : []),
    ],
  }
}


let cachedDynamicConfiguration: { configuration: RTCConfiguration; expiresAt: number } | null = null

function isDynamicIceServerArray(value: unknown): value is RTCConfiguration['iceServers'] {
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
