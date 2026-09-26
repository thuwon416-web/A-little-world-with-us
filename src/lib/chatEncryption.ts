/**
 * End-to-End Encryption for Chat Messages
 * Uses AES-GCM with couple-specific key
 * 
 * DUAL-KEY SUPPORT:
 * - New messages use NEXT_PUBLIC_CHAT_ENCRYPTION_KEY (env var)
 * - Old messages use legacy hardcoded prefix (fallback)
 * - Both keys coexist forever (no re-encryption needed)
 */

const LEGACY_KEY_PREFIX = 'a-little-world-with-us-chat-'
const PBKDF2_ITERATIONS = 100000
const IV_LENGTH = 12
const CHAT_FORMAT_MAGIC = new Uint8Array([0xC1, 0xAE, 0x01, 0x00])

// New env-based derivation
async function deriveNewKey(coupleId: string): Promise<CryptoKey> {
  const secret = process.env.NEXT_PUBLIC_CHAT_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('NEXT_PUBLIC_CHAT_ENCRYPTION_KEY not set')
  }
  
  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(coupleId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Legacy derivation (for old messages only)
async function deriveLegacyKey(coupleId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(LEGACY_KEY_PREFIX + coupleId),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(coupleId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Public API — uses NEW key for encryption.
 */
export async function deriveChatKey(coupleId: string): Promise<CryptoKey> {
  return deriveNewKey(coupleId)
}

export async function encryptMessage(text: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(text)
  )
  // Format: [4-byte magic/version][12-byte IV][ciphertext]
  const combined = new Uint8Array(CHAT_FORMAT_MAGIC.length + iv.length + ciphertext.byteLength)
  combined.set(CHAT_FORMAT_MAGIC, 0)
  combined.set(iv, CHAT_FORMAT_MAGIC.length)
  combined.set(new Uint8Array(ciphertext), CHAT_FORMAT_MAGIC.length + iv.length)
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt — tries NEW key first, falls back to LEGACY on failure.
 */
export async function decryptMessage(
  encrypted: string,
  newKey: CryptoKey,
  coupleId: string
): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  const decoder = new TextDecoder()
  
  const hasMagic = CHAT_FORMAT_MAGIC.every((byte, index) => combined[index] === byte)
  if (hasMagic) {
    const ivStart = CHAT_FORMAT_MAGIC.length
    const iv = combined.slice(ivStart, ivStart + IV_LENGTH)
    const ciphertext = combined.slice(ivStart + IV_LENGTH)
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      newKey,
      ciphertext
    )
    return decoder.decode(plaintext)
  }

  // Unprefixed legacy format: [IV][ciphertext]
  const legacyIv = combined.slice(0, IV_LENGTH)
  const legacyCiphertext = combined.slice(IV_LENGTH)
  const legacyKey = await deriveLegacyKey(coupleId)
  try {
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: legacyIv },
      legacyKey,
      legacyCiphertext
    )
    return decoder.decode(plaintext)
  } catch (legacyError) {
    // Preserve messages written with the old one-byte versioned format.
    if (combined[0] !== 1) throw legacyError
    const oldIv = combined.slice(1, 1 + IV_LENGTH)
    const oldCiphertext = combined.slice(1 + IV_LENGTH)
    const plaintext = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: oldIv },
      newKey,
      oldCiphertext
    )
    return decoder.decode(plaintext)
  }
}
