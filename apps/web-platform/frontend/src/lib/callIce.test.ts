import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function loadConfiguration() {
  const iceModule = await import('./callIce')
  return iceModule.getCallIceConfiguration()
}

describe('getCallIceConfiguration', () => {
  it('keeps the public STUN fallback when TURN credentials are absent', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURN_URLS', '')
    vi.stubEnv('NEXT_PUBLIC_TURN_USERNAME', '')
    vi.stubEnv('NEXT_PUBLIC_TURN_CREDENTIAL', '')

    const config = await loadConfiguration()

    expect(config.iceServers.length).toBe(4)
    expect(config.iceServers.every((server) => !String(server.urls).startsWith('turn:'))).toBe(true)
  })

  it('adds only valid TURN URLs when both credentials are configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURN_URLS', ' turn:relay.example:3478, https://not-a-turn-url, turns:relay.example:5349 ')
    vi.stubEnv('NEXT_PUBLIC_TURN_USERNAME', ' short-lived-user ')
    vi.stubEnv('NEXT_PUBLIC_TURN_CREDENTIAL', ' short-lived-secret ')

    const config = await loadConfiguration()
    const turnServer = config.iceServers[config.iceServers.length - 1]

    expect(turnServer.urls).toEqual(['turn:relay.example:3478', 'turns:relay.example:5349'])
    expect(turnServer.username).toBe('short-lived-user')
    expect(turnServer.credential).toBe('short-lived-secret')
  })

  it('does not add a partially configured TURN server', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURN_URLS', 'turn:relay.example:3478')
    vi.stubEnv('NEXT_PUBLIC_TURN_USERNAME', 'user')
    vi.stubEnv('NEXT_PUBLIC_TURN_CREDENTIAL', '')

    const config = await loadConfiguration()

    expect(config.iceServers).toHaveLength(4)
  })
})


describe('getCallIceConfigurationAsync', () => {
  it('uses authenticated Metered ICE servers when the server endpoint returns them', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURN_URLS', '')
    const iceServers = [
      { urls: 'stun:global.relay.metered.ca:80' },
      { urls: 'turn:global.relay.metered.ca:80', username: 'temporary-user', credential: 'temporary-password' },
    ]
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      iceServers,
      expiresAt: Date.now() + 60 * 60_000,
    }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const module = await import('./callIce')
    const config = await module.getCallIceConfigurationAsync('access-token', 'https://app.example/')

    expect(fetchMock).toHaveBeenCalledWith('https://app.example/api/turn/credentials', expect.objectContaining({
      headers: { Authorization: 'Bearer access-token' },
      cache: 'no-store',
    }))
    expect(config.iceServers).toEqual(iceServers)
  })

  it('falls back to the existing static configuration when the dynamic endpoint is unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURN_URLS', 'turn:legacy.relay.example:3478')
    vi.stubEnv('NEXT_PUBLIC_TURN_USERNAME', 'legacy-user')
    vi.stubEnv('NEXT_PUBLIC_TURN_CREDENTIAL', 'legacy-password')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))

    const module = await import('./callIce')
    const config = await module.getCallIceConfigurationAsync('access-token', 'https://app.example')

    expect(config.iceServers).toHaveLength(5)
    expect(config.iceServers.some((server) => server.username === 'legacy-user')).toBe(true)
  })
})
