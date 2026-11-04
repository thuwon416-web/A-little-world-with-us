import { webcrypto } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { decryptChatMessageServer } from './chatEncryptionServer'
import { decryptMessage, deriveChatKey, encryptMessage } from './chatEncryption'

const COUPLE_ID = 'chat-encryption-compatibility-test'
const TEST_SECRET = 'test-only-chat-encryption-key-never-use-in-production'
const LEGACY_PREFIX = 'a-little-world-with-us-chat-'
const ITERATIONS = 100000

async function deriveLegacyKey(coupleId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const material = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(LEGACY_PREFIX + coupleId),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(coupleId),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCodePoint(...bytes))
}

describe('chat encryption compatibility', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'crypto', { configurable: true, value: webcrypto })
    process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY = TEST_SECRET
    process.env.CHAT_ENCRYPTION_KEY = TEST_SECRET
  })

  it('round-trips new client ciphertext and allows the server to decrypt it', async () => {
    const plaintext = 'cross-platform compatibility check'
    const key = await deriveChatKey(COUPLE_ID)
    const encrypted = await encryptMessage(plaintext, key)

    await expect(decryptMessage(encrypted, key, COUPLE_ID)).resolves.toBe(plaintext)
    await expect(decryptChatMessageServer(encrypted, COUPLE_ID)).resolves.toBe(plaintext)
  })

  it('continues to decrypt the unprefixed legacy message format on web and server', async () => {
    const plaintext = 'legacy message remains readable'
    const key = await deriveLegacyKey(COUPLE_ID)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext)
    )
    const legacyPayload = new Uint8Array(iv.length + ciphertext.byteLength)
    legacyPayload.set(iv, 0)
    legacyPayload.set(new Uint8Array(ciphertext), iv.length)
    const encrypted = toBase64(legacyPayload)
    const newKey = await deriveChatKey(COUPLE_ID)

    await expect(decryptMessage(encrypted, newKey, COUPLE_ID)).resolves.toBe(plaintext)
    await expect(decryptChatMessageServer(encrypted, COUPLE_ID)).resolves.toBe(plaintext)
  })
})
