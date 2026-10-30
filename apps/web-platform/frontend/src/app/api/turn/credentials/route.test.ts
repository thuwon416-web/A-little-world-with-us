// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { GET } from './route'

describe('Metered TURN credential endpoint authentication', () => {
  it('rejects requests without a bearer access token', async () => {
    const response = await GET(new Request('https://example.test/api/turn/credentials'))

    expect(response.status).toBe(401)
  })
})
