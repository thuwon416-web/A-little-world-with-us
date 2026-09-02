/**
 * PIN Lock + Client-Side Encryption
 */

const PIN_STORAGE_KEY = 'a-little-world-with-us-pin'

export async function setPIN(pin: string): Promise<void> {
  if (typeof window === 'undefined') return

  const encoder = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
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
    ['encrypt', 'decrypt']
  )

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(12) },
    key,
    encoder.encode('verified')
  )

  const combined = new Uint8Array(salt.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(new Uint8Array(encrypted), salt.length)

  localStorage.setItem(PIN_STORAGE_KEY, btoa(String.fromCharCode(...combined)))
}

export async function verifyPIN(pin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY)
    if (!stored) return false

    const combined = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
    const salt = combined.slice(0, 16)
    const encrypted = combined.slice(16)

    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
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

    await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(12) },
      key,
      encrypted
    )

    return true
  } catch {
    return false
  }
}

export function hasPIN(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(PIN_STORAGE_KEY)
}

export function removePIN(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PIN_STORAGE_KEY)
}
