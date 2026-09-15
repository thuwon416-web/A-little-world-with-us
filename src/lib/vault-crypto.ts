const PBKDF2_ITERATIONS = 100_000
const AES_KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16

const BACKUP_WORDS = [
  'amber', 'apple', 'bamboo', 'candle', 'cedar', 'cloud', 'coral', 'dawn',
  'ember', 'forest', 'garden', 'harbor', 'honey', 'lantern', 'meadow', 'moon',
  'olive', 'pearl', 'petal', 'river', 'saffron', 'silver', 'summer', 'willow',
]

const getCrypto = () => {
  const crypto = typeof window !== 'undefined' ? window.crypto : globalThis.crypto
  if (!crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable')
  }
  return crypto
}

function asBufferSource(data: Uint8Array): ArrayBuffer {
  return new Uint8Array(data).buffer as ArrayBuffer
}

export function b64encode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
}

export function b64decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

export function generateSalt(): string {
  const bytes = getCrypto().getRandomValues(new Uint8Array(SALT_LENGTH))
  return b64encode(bytes)
}

export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: string
): Promise<CryptoKey> {
  const crypto = getCrypto()
  const material = await crypto.subtle.importKey(
    'raw',
    asBufferSource(new TextEncoder().encode(passphrase.normalize('NFKC'))),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asBufferSource(b64decode(salt)), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function generateMasterKey(): Promise<Uint8Array> {
  return getCrypto().getRandomValues(new Uint8Array(32))
}

async function importRawKey(bytes: Uint8Array, usages: KeyUsage[]): Promise<CryptoKey> {
  return getCrypto().subtle.importKey('raw', asBufferSource(bytes), { name: 'AES-GCM' }, false, usages)
}

export async function wrapMasterKey(
  masterKey: Uint8Array,
  wrappingKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = getCrypto().getRandomValues(new Uint8Array(IV_LENGTH))
  const encrypted = await getCrypto().subtle.encrypt({ name: 'AES-GCM', iv: asBufferSource(iv) }, wrappingKey, asBufferSource(masterKey))
  return { ciphertext: b64encode(new Uint8Array(encrypted)), iv: b64encode(iv) }
}

export async function unwrapMasterKey(
  ciphertext: string,
  iv: string,
  wrappingKey: CryptoKey
): Promise<Uint8Array> {
  const decrypted = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(b64decode(iv)) },
    wrappingKey,
    asBufferSource(b64decode(ciphertext))
  )
  return new Uint8Array(decrypted)
}

export async function encryptCredential(
  data: object,
  masterKey: Uint8Array
): Promise<{ encryptedPayload: string; iv: string }> {
  const iv = getCrypto().getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await importRawKey(masterKey, ['encrypt'])
  const encrypted = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    key,
    asBufferSource(new TextEncoder().encode(JSON.stringify(data)))
  )
  return { encryptedPayload: b64encode(new Uint8Array(encrypted)), iv: b64encode(iv) }
}

export async function decryptCredential(
  encryptedPayload: string,
  iv: string,
  masterKey: Uint8Array
): Promise<object> {
  const key = await importRawKey(masterKey, ['decrypt'])
  const decrypted = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(b64decode(iv)) },
    key,
    asBufferSource(b64decode(encryptedPayload))
  )
  return JSON.parse(new TextDecoder().decode(decrypted)) as object
}

export function generateBackupKeyPhrase(): string[] {
  const crypto = getCrypto()
  return Array.from({ length: 12 }, () => {
    const index = crypto.getRandomValues(new Uint32Array(1))[0] % BACKUP_WORDS.length
    return BACKUP_WORDS[index]
  })
}

export async function deriveKeyFromBackupPhrase(
  phrase: string[],
  salt: string
): Promise<CryptoKey> {
  return deriveKeyFromPassphrase(phrase.join(' '), salt)
}
