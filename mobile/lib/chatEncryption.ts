import { gcm } from '@noble/ciphers/aes.js'
import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
import * as Crypto from 'expo-crypto'

const LEGACY_KEY_PREFIX = 'a-little-world-with-us-chat-'
const PBKDF2_ITERATIONS = 100000
const IV_LENGTH = 12
const CHAT_FORMAT_MAGIC = new Uint8Array([0xc1, 0xae, 0x01, 0x00])

const NEW_SECRET = process.env.EXPO_PUBLIC_CHAT_ENCRYPTION_KEY

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// New env-based derivation
async function deriveNewKey(coupleId: string): Promise<Uint8Array> {
  if (!NEW_SECRET) throw new Error('EXPO_PUBLIC_CHAT_ENCRYPTION_KEY not set')
  return pbkdf2(sha256, NEW_SECRET, coupleId, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  })
}

// Legacy derivation (for old messages only)
async function deriveLegacyKey(coupleId: string): Promise<Uint8Array> {
  return pbkdf2(sha256, LEGACY_KEY_PREFIX + coupleId, coupleId, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  })
}

/**
 * Public API — uses NEW key for encryption.
 */
export async function deriveChatKey(coupleId: string): Promise<Uint8Array> {
  return deriveNewKey(coupleId)
}

export async function encryptMessage(text: string, key: Uint8Array): Promise<string> {
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH)
  const cipher = gcm(key, iv)
  const ciphertext = cipher.encrypt(encoder.encode(text))

  // Format: [4-byte magic/version][12-byte IV][ciphertext]
  const combined = new Uint8Array(CHAT_FORMAT_MAGIC.length + iv.length + ciphertext.length)
  combined.set(CHAT_FORMAT_MAGIC, 0)
  combined.set(iv, CHAT_FORMAT_MAGIC.length)
  combined.set(ciphertext, CHAT_FORMAT_MAGIC.length + iv.length)

  return base64Encode(combined)
}

/**
 * Decrypt — tries NEW key first, falls back to LEGACY on failure.
 */
export async function decryptMessage(
  encrypted: string,
  newKey: Uint8Array,
  coupleId: string
): Promise<string> {
  const combined = base64Decode(encrypted)

  const hasMagic = CHAT_FORMAT_MAGIC.every((byte, index) => combined[index] === byte)
  if (hasMagic) {
    const ivStart = CHAT_FORMAT_MAGIC.length
    const iv = combined.slice(ivStart, ivStart + IV_LENGTH)
    const ciphertext = combined.slice(ivStart + IV_LENGTH)
    const cipher = gcm(newKey, iv)
    const plaintext = cipher.decrypt(ciphertext)
    return decoder.decode(plaintext)
  }

  // Unprefixed legacy format: [IV][ciphertext]
  const legacyIv = combined.slice(0, IV_LENGTH)
  const legacyCiphertext = combined.slice(IV_LENGTH)
  const legacyKey = await deriveLegacyKey(coupleId)
  try {
    const cipher = gcm(legacyKey, legacyIv)
    const plaintext = cipher.decrypt(legacyCiphertext)
    return decoder.decode(plaintext)
  } catch (legacyError) {
    // Preserve messages written with the old one-byte versioned format.
    if (combined[0] !== 1) throw legacyError
    const oldIv = combined.slice(1, 1 + IV_LENGTH)
    const oldCiphertext = combined.slice(1 + IV_LENGTH)
    const cipher = gcm(newKey, oldIv)
    const plaintext = cipher.decrypt(oldCiphertext)
    return decoder.decode(plaintext)
  }
}

/**
 * Base64 encoding (Expo-compatible)
 */
function base64Encode(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Base64 decoding (Expo-compatible)
 */
function base64Decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
