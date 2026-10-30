// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}))
import { GET } from './route'

describe('Metered TURN credential endpoint authentication', () => {
  it('rejects requests without a bearer access token', async () => {
    const response = await GET(new Request('https://example.test/api/turn/credentials'))

    expect(response.status).toBe(401)
  })
})
