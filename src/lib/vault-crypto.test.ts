import { beforeAll, describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import {
  decryptCredential,
  deriveKeyFromBackupPhrase,
  deriveKeyFromPassphrase,
  encryptCredential,
  generateBackupKeyPhrase,
  generateMasterKey,
  generateSalt,
  unwrapMasterKey,
  wrapMasterKey,
} from './vault-crypto'

describe('Vault crypto', () => {
  beforeAll(() => {
    if (!globalThis.crypto) {
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto })
    }
  })

  it('derives a deterministic key from the same passphrase and salt', async () => {
    const salt = generateSalt()
    const first = await deriveKeyFromPassphrase('correct horse battery', salt)
    const second = await deriveKeyFromPassphrase('correct horse battery', salt)
    const master = await generateMasterKey()
    const wrapped = await wrapMasterKey(master, first)
    expect(await unwrapMasterKey(wrapped.ciphertext, wrapped.iv, second)).toEqual(master)
  })

  it('wraps and unwraps a master key', async () => {
    const key = await deriveKeyFromPassphrase('a secure vault phrase', generateSalt())
    const master = await generateMasterKey()
    const wrapped = await wrapMasterKey(master, key)
    expect(await unwrapMasterKey(wrapped.ciphertext, wrapped.iv, key)).toEqual(master)
  })

  it('encrypts and decrypts credentials', async () => {
    const master = await generateMasterKey()
    const data = { title: 'Gmail', username: 'ko@example.com', password: 'secret' }
    const encrypted = await encryptCredential(data, master)
    expect(await decryptCredential(encrypted.encryptedPayload, encrypted.iv, master)).toEqual(data)
  })

  it('rejects a wrong passphrase', async () => {
    const salt = generateSalt()
    const master = await generateMasterKey()
    const wrappingKey = await deriveKeyFromPassphrase('right passphrase', salt)
    const wrongKey = await deriveKeyFromPassphrase('wrong passphrase', salt)
    const wrapped = await wrapMasterKey(master, wrappingKey)
    await expect(unwrapMasterKey(wrapped.ciphertext, wrapped.iv, wrongKey)).rejects.toThrow()
  })

  it('creates a stable key from a twelve-word backup phrase', async () => {
    const phrase = generateBackupKeyPhrase()
    expect(phrase).toHaveLength(12)
    const salt = generateSalt()
    const first = await deriveKeyFromBackupPhrase(phrase, salt)
    const second = await deriveKeyFromBackupPhrase(phrase, salt)
    const master = await generateMasterKey()
    const wrapped = await wrapMasterKey(master, first)
    expect(await unwrapMasterKey(wrapped.ciphertext, wrapped.iv, second)).toEqual(master)
  })
})
