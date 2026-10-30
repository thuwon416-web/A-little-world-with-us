// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { GET } from './route'

const originalCronSecret = process.env.CRON_SECRET

afterEach(() => {
  if (originalCronSecret === undefined) delete process.env.CRON_SECRET
  else process.env.CRON_SECRET = originalCronSecret
})

describe('Metered TURN rotation cron authentication', () => {
  it('fails closed when the cron secret is missing', async () => {
    delete process.env.CRON_SECRET
    const response = await GET(new Request('https://example.test/api/cron/rotate-turn-credential'))

    expect(response.status).toBe(503)
  })

  it('rejects requests without the configured bearer secret', async () => {
    process.env.CRON_SECRET = 'configured-cron-secret'
    const response = await GET(new Request('https://example.test/api/cron/rotate-turn-credential', {
      headers: { Authorization: 'Bearer incorrect-secret' },
    }))

    expect(response.status).toBe(401)
  })
})
