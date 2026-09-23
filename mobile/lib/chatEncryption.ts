import { gcm } from '@noble/ciphers/aes'
import { pbkdf2 } from '@noble/hashes/pbkdf2'
import { sha256 } from '@noble/hashes/sha2.js'
import * as Crypto from 'expo-crypto'

const LEGACY_KEY_PREFIX = 'a-little-world-with-us-chat-'
const PBKDF2_ITERATIONS = 100000
const IV_LENGTH = 12

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

  // Format: [1 byte version][12 byte IV][ciphertext]
  const version = new Uint8Array([1]) // version 1 = new key
  const combined = new Uint8Array(version.length + iv.length + ciphertext.length)
  combined.set(version, 0)
  combined.set(iv, version.length)
  combined.set(ciphertext, version.length + iv.length)

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

  // Try new format first (version byte = 1)
  if (combined[0] === 1) {
    const iv = combined.slice(1, 1 + IV_LENGTH)
    const ciphertext = combined.slice(1 + IV_LENGTH)
    try {
      const cipher = gcm(newKey, iv)
      const plaintext = cipher.decrypt(ciphertext)
      return decoder.decode(plaintext)
    } catch {
      // fall through to legacy attempt
    }
  }

  // Legacy format: [IV][ciphertext]
  const legacyIv = combined.slice(0, IV_LENGTH)
  const legacyCiphertext = combined.slice(IV_LENGTH)
  const legacyKey = await deriveLegacyKey(coupleId)
  const cipher = gcm(legacyKey, legacyIv)
  const plaintext = cipher.decrypt(legacyCiphertext)
  return decoder.decode(plaintext)
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
