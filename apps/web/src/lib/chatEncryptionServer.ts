/**
 * Server-side chat decryption (dual-key support)
 * - New messages use CHAT_ENCRYPTION_KEY (env var)
 * - Old messages use legacy hardcoded prefix (fallback)
 */

const LEGACY_KEY_PREFIX = 'a-little-world-with-us-chat-'
const PBKDF2_ITERATIONS = 100000
const IV_LENGTH = 12
const CHAT_FORMAT_MAGIC = new Uint8Array([0xC1, 0xAE, 0x01, 0x00])

// New env-based derivation
async function deriveNewKey(coupleId: string): Promise<CryptoKey> {
  const secret = process.env.CHAT_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('CHAT_ENCRYPTION_KEY not set')
  }
  
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(coupleId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
}

// Legacy derivation (for old messages only)
async function deriveLegacyKey(coupleId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(LEGACY_KEY_PREFIX + coupleId),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(coupleId),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
}

/**
 * Decrypt — tries NEW key first, falls back to LEGACY on failure.
 */
export async function decryptChatMessageServer(encrypted: string, coupleId: string): Promise<string> {
  const combined = Uint8Array.from(Buffer.from(encrypted, 'base64'))
  const decoder = new TextDecoder()
  
  // Current client format: [4-byte magic/version][12-byte IV][ciphertext]
  const hasMagic = CHAT_FORMAT_MAGIC.every((byte, index) => combined[index] === byte)
  if (hasMagic) {
    const ivStart = CHAT_FORMAT_MAGIC.length
    const iv = combined.slice(ivStart, ivStart + IV_LENGTH)
    const ciphertext = combined.slice(ivStart + IV_LENGTH)
    try {
      const newKey = await deriveNewKey(coupleId)
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        newKey,
        ciphertext
      )
      return decoder.decode(plaintext)
    } catch {
      // fall through to legacy attempt
    }
  }

  // Older versioned format: [version=1][12-byte IV][ciphertext]
  if (combined[0] === 1) {
    const iv = combined.slice(1, 1 + IV_LENGTH)
    const ciphertext = combined.slice(1 + IV_LENGTH)
    try {
      const newKey = await deriveNewKey(coupleId)
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        newKey,
        ciphertext
      )
      return decoder.decode(plaintext)
    } catch {
      // fall through to legacy attempt
    }
  }

  // Legacy format: [IV][ciphertext]
  const legacyIv = combined.slice(0, IV_LENGTH)
  const legacyCiphertext = combined.slice(IV_LENGTH)
  const legacyKey = await deriveLegacyKey(coupleId)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: legacyIv },
    legacyKey,
    legacyCiphertext
  )
  return decoder.decode(plaintext)
}
