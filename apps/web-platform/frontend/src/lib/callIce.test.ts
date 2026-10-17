import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
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
