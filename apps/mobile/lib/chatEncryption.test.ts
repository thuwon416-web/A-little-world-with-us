import { webcrypto } from 'node:crypto'
import { gcm } from '@noble/ciphers/aes.js'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (length: number) =>
    Uint8Array.from({ length }, (_, index) => index + 1)
  ),
}))

const COUPLE_ID = 'mobile-chat-encryption-compatibility'
const TEST_SECRET = 'test-only-chat-encryption-key-never-use-in-production'
const LEGACY_PREFIX = 'a-little-world-with-us-chat-'
const ITERATIONS = 100000

process.env.EXPO_PUBLIC_CHAT_ENCRYPTION_KEY = TEST_SECRET

const { deriveChatKey, encryptMessage, decryptMessage } = require('./chatEncryption') as typeof import('./chatEncryption')

async function deriveWebKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const material = await webcrypto.subtle.importKey(
    'raw',
    encoder.encode(TEST_SECRET),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return (await webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(COUPLE_ID),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  )) as unknown as CryptoKey
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCodePoint(...bytes))
}

describe('mobile chat encryption compatibility', () => {
  it('derives the same AES key as Web Crypto for the shared couple and secret', async () => {
    const mobileKey = await deriveChatKey(COUPLE_ID)
    const webKey = await deriveWebKey()
    const webRawKey = await webcrypto.subtle.exportKey('raw', webKey)
    expect(mobileKey).toEqual(new Uint8Array(webRawKey))
  })

  it('encrypts on mobile in the versioned format and decrypts with Web Crypto', async () => {
    const plaintext = 'mobile ciphertext must be readable by web'
    const key = await deriveChatKey(COUPLE_ID)
    const encrypted = await encryptMessage(plaintext, key)
    const payload = Uint8Array.from(atob(encrypted), (character) => character.charCodeAt(0))

    expect(Array.from(payload.slice(0, 4))).toEqual([0xc1, 0xae, 0x01, 0x00])

    const iv = payload.slice(4, 16)
    const ciphertext = payload.slice(16)
    const webKey = await deriveWebKey()
    const decrypted = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv }, webKey, ciphertext)
    expect(new TextDecoder().decode(decrypted)).toBe(plaintext)
    await expect(decryptMessage(encrypted, key, COUPLE_ID)).resolves.toBe(plaintext)
  })

  it('continues to decrypt unprefixed legacy messages on mobile', async () => {
    const plaintext = 'legacy mobile message remains readable'
    const legacyKey = pbkdf2(
      sha256,
      LEGACY_PREFIX + COUPLE_ID,
      COUPLE_ID,
      { c: ITERATIONS, dkLen: 32 }
    )
    const iv = Uint8Array.from({ length: 12 }, (_, index) => 12 - index)
    const ciphertext = gcm(legacyKey, iv).encrypt(new TextEncoder().encode(plaintext))
    const payload = new Uint8Array(iv.length + ciphertext.length)
    payload.set(iv, 0)
    payload.set(ciphertext, iv.length)

    const currentKey = await deriveChatKey(COUPLE_ID)
    await expect(decryptMessage(toBase64(payload), currentKey, COUPLE_ID)).resolves.toBe(plaintext)
  })
})
