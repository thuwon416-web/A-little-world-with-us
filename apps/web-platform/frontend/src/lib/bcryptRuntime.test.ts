import bcrypt from 'bcrypt'
import { describe, expect, it } from 'vitest'

describe('bcrypt runtime', () => {
  it('can hash and verify a PIN using the installed runtime binding', async () => {
    const pin = 'test-pin-value-000000'
    const hash = await bcrypt.hash(pin, 4)

    await expect(bcrypt.compare(pin, hash)).resolves.toBe(true)
    await expect(bcrypt.compare('wrong-test-pin', hash)).resolves.toBe(false)
  })
})
