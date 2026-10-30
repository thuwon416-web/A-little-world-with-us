import { afterEach, describe, expect, it, vi } from 'vitest'
import { getMeteredAppUrl, isIceServerArray } from './metered-turn'

const originalAppUrl = process.env.METERED_APP_URL

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.METERED_APP_URL
  else process.env.METERED_APP_URL = originalAppUrl
  vi.resetModules()
})

describe('Metered TURN configuration validation', () => {
  it('accepts only HTTPS Metered application domains', () => {
    process.env.METERED_APP_URL = 'https://couple-app.metered.live'
    expect(getMeteredAppUrl()?.hostname).toBe('couple-app.metered.live')

    process.env.METERED_APP_URL = 'http://couple-app.metered.live'
    expect(getMeteredAppUrl()).toBeNull()

    process.env.METERED_APP_URL = 'https://attacker.example'
    expect(getMeteredAppUrl()).toBeNull()

    process.env.METERED_APP_URL = 'https://couple-app.metered.live/unexpected'
    expect(getMeteredAppUrl()).toBeNull()
  })

  it('accepts authenticated TURN servers and rejects malformed or unauthenticated relay entries', () => {
    expect(isIceServerArray([
      { urls: 'stun:global.relay.metered.ca:80' },
      { urls: 'turn:global.relay.metered.ca:80', username: 'temporary-user', credential: 'temporary-password' },
    ])).toBe(true)

    expect(isIceServerArray([
      { urls: 'turn:global.relay.metered.ca:80' },
    ])).toBe(false)

    expect(isIceServerArray([
      { urls: 'https://attacker.example' },
    ])).toBe(false)
  })
})
