const originalTurnEnv = {
  urls: process.env.EXPO_PUBLIC_TURN_URLS,
  username: process.env.EXPO_PUBLIC_TURN_USERNAME,
  credential: process.env.EXPO_PUBLIC_TURN_CREDENTIAL,
}

afterEach(() => {
  jest.restoreAllMocks()
  if (originalTurnEnv.urls === undefined) delete process.env.EXPO_PUBLIC_TURN_URLS
  else process.env.EXPO_PUBLIC_TURN_URLS = originalTurnEnv.urls
  if (originalTurnEnv.username === undefined) delete process.env.EXPO_PUBLIC_TURN_USERNAME
  else process.env.EXPO_PUBLIC_TURN_USERNAME = originalTurnEnv.username
  if (originalTurnEnv.credential === undefined) delete process.env.EXPO_PUBLIC_TURN_CREDENTIAL
  else process.env.EXPO_PUBLIC_TURN_CREDENTIAL = originalTurnEnv.credential
  jest.resetModules()
})

async function loadConfiguration() {
  const module = await import('./callIce')
  return module.getCallIceConfiguration()
}

describe('getCallIceConfiguration', () => {
  it('uses STUN when TURN credentials are not configured', async () => {
    process.env.EXPO_PUBLIC_TURN_URLS = ''
    process.env.EXPO_PUBLIC_TURN_USERNAME = ''
    process.env.EXPO_PUBLIC_TURN_CREDENTIAL = ''

    const config = await loadConfiguration()

    expect(config.iceServers).toEqual([{ urls: 'stun:stun.l.google.com:19302' }])
  })

  it('adds valid TURN URLs only when username and credential are present', async () => {
    process.env.EXPO_PUBLIC_TURN_URLS = ' turn:relay.example:3478, https://invalid.example, turns:relay.example:5349 '
    process.env.EXPO_PUBLIC_TURN_USERNAME = ' short-lived-user '
    process.env.EXPO_PUBLIC_TURN_CREDENTIAL = ' short-lived-secret '

    const config = await loadConfiguration()

    expect(config.iceServers).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: ['turn:relay.example:3478', 'turns:relay.example:5349'],
        username: 'short-lived-user',
        credential: 'short-lived-secret',
      },
    ])
  })

  it('fails closed to STUN if TURN configuration is incomplete', async () => {
    process.env.EXPO_PUBLIC_TURN_URLS = 'turn:relay.example:3478'
    process.env.EXPO_PUBLIC_TURN_USERNAME = 'user'
    process.env.EXPO_PUBLIC_TURN_CREDENTIAL = ''

    const config = await loadConfiguration()

    expect(config.iceServers).toEqual([{ urls: 'stun:stun.l.google.com:19302' }])
  })
})


describe('getCallIceConfigurationAsync', () => {
  it('uses authenticated Metered ICE servers when the server endpoint returns them', async () => {
    process.env.EXPO_PUBLIC_TURN_URLS = ''
    const iceServers = [
      { urls: 'stun:global.relay.metered.ca:80' },
      { urls: 'turn:global.relay.metered.ca:80', username: 'temporary-user', credential: 'temporary-password' },
    ]
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      iceServers,
      expiresAt: Date.now() + 60 * 60_000,
    }), { status: 200 }))

    const module = await import('./callIce')
    const config = await module.getCallIceConfigurationAsync('access-token', 'https://app.example/')

    expect(global.fetch).toHaveBeenCalledWith('https://app.example/api/turn/credentials', expect.objectContaining({
      headers: { Authorization: 'Bearer access-token' },
      cache: 'no-store',
    }))
    expect(config.iceServers).toEqual(iceServers)
  })

  it('falls back to the existing static configuration when the dynamic endpoint is unavailable', async () => {
    process.env.EXPO_PUBLIC_TURN_URLS = 'turn:legacy.relay.example:3478'
    process.env.EXPO_PUBLIC_TURN_USERNAME = 'legacy-user'
    process.env.EXPO_PUBLIC_TURN_CREDENTIAL = 'legacy-password'
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 503 }))

    const module = await import('./callIce')
    const config = await module.getCallIceConfigurationAsync('access-token', 'https://app.example')

    expect(config.iceServers).toHaveLength(2)
    expect(config.iceServers.some((server) => server.username === 'legacy-user')).toBe(true)
  })
})
