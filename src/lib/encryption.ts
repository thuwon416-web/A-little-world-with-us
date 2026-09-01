/**
 * Client-side encryption for sensitive data (P3 - Privacy)
 * Uses Web Crypto API for AES-GCM encryption
 */

const ENCRYPTION_KEY = 'a-little-world-with-us-encryption-key'

/**
 * Encrypt sensitive data before sending to Supabase
 */
export async function encryptData(data: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Encryption only works in browser')
  }

  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  // Combine salt, iv, and encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt data from Supabase
 */
export async function decryptData(encrypted: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Decryption only works in browser')
  }

  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const data = combined.slice(28)

  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Encrypt object properties selectively
 */
export async function encryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  sensitiveFields: (keyof T)[]
): Promise<Partial<T>> {
  const result = { ...data }

  for (const field of sensitiveFields) {
    if (typeof result[field] === 'string') {
      result[field] = await encryptData(result[field] as string) as any
    }
  }

  return result
}

/**
 * Decrypt object properties selectively
 */
export async function decryptSensitiveFields<T extends Record<string, any>>(
  data: T,
  sensitiveFields: (keyof T)[]
): Promise<Partial<T>> {
  const result = { ...data }

  for (const field of sensitiveFields) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = await decryptData(result[field] as string) as any
      } catch {
        // If decryption fails, leave as-is (might not be encrypted)
      }
    }
  }

  return result
}
